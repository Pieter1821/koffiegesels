using Projects;

var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddAzurePostgresFlexibleServer("postgres")
                    .RunAsContainer(postgres =>
                    {
                        postgres.WithDataVolume();
                        postgres.WithPgAdmin(pgAdmin =>
                        {
                            pgAdmin.WithHostPort(5050);
                        });
                    });

var templateAppDb = postgres.AddDatabase("KoffiegeselsDB", "Koffiegesels");

var keycloakPassword = builder.AddParameter("KeycloakPassword", secret: true, value: "admin");
int? keycloakPort = builder.ExecutionContext.IsRunMode ? 8080 : null;
var keycloak = builder.AddKeycloak("keycloak", adminPassword: keycloakPassword, port: keycloakPort)
                      .WithLifetime(ContainerLifetime.Persistent);

var keycloakAuthority = ReferenceExpression.Create(
    $"{keycloak.GetEndpoint("http").Property(EndpointProperty.Url)}/realms/koffiegesels"
);

builder.AddProject<Koffiegesels_Api>("koffiegesels-api")
        .WithReference(templateAppDb)
        .WaitFor(templateAppDb)
        .WithEnvironment("Auth__Authority", keycloakAuthority)
        .WithEnvironment("SWAGGERUI_CLIENTID", builder.Configuration["SwaggerUI:ClientId"])
        .WaitFor(keycloak)
        .WithUrls(context =>
        {
            context.Urls.Add(new()
            {
                Url = "/swagger",
                DisplayText = "API Docs",
                Endpoint = context.GetEndpoint("http")
            });
        })
        .WithExternalHttpEndpoints()
        .WithHttpHealthCheck("/health/ready");

if (builder.ExecutionContext.IsRunMode)
{
    keycloak.WithDataVolume()
            .WithRealmImport("./realms")
            // Mount our custom login theme alongside the built-in themes (do NOT
            // mount over /opt/keycloak/themes or the base themes disappear).
            .WithBindMount("themes/koffiegesels", "/opt/keycloak/themes/koffiegesels", isReadOnly: true)
            // Dev: serve theme edits without restarting the container.
            .WithEnvironment("KC_SPI_THEME_CACHE_THEMES", "false")
            .WithEnvironment("KC_SPI_THEME_CACHE_TEMPLATES", "false")
            .WithEnvironment("KC_SPI_THEME_STATIC_MAX_AGE", "-1");
}

if (builder.ExecutionContext.IsPublishMode)
{
    var postgresUser = builder.AddParameter("PostgresUser", value: "postgres");
    var postgresPassword = builder.AddParameter("PostgresPassword", secret: true);
    postgres.WithPasswordAuthentication(userName: postgresUser, password: postgresPassword);

    var keycloakDb = postgres.AddDatabase("keycloakDB", "keycloak");

    var keycloakDbUrl = ReferenceExpression.Create(
        $"jdbc:postgresql://{postgres.Resource.HostName}/{keycloakDb.Resource.DatabaseName}"
    );

    keycloak.WithEnvironment("KC_HTTP_ENABLED", "true")
            .WithEnvironment("KC_PROXY_HEADERS", "xforwarded")
            .WithEnvironment("KC_HOSTNAME_STRICT", "false")
            .WithEnvironment("KC_DB", "postgres")
            .WithEnvironment("KC_DB_URL", keycloakDbUrl)
            .WithEnvironment("KC_DB_USERNAME", postgresUser)
            .WithEnvironment("KC_DB_PASSWORD", postgresPassword)
            .WithEndpoint("http", e => e.IsExternal = true);
}

builder.AddAzureContainerAppEnvironment("cae");

builder.Build().Run();