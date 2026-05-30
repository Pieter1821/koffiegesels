using System.Security.Claims;

namespace Koffiegesels.Api.Shared.Authentication;

/// <summary>
/// The authenticated principal for the current request. Backed by the JWT
/// <c>sub</c> claim issued by Keycloak.
/// </summary>
public interface ICurrentUser
{
    /// <summary>Stable owner identifier (JWT <c>sub</c>).</summary>
    string UserId { get; }
}

/// <summary>
/// Resolves <see cref="ICurrentUser"/> from the request's <see cref="ClaimsPrincipal"/>.
/// Registered scoped; endpoints sit behind <c>RequireAuthorization</c>, so a
/// missing <c>sub</c> indicates a misconfigured token and fails loudly.
/// </summary>
public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public string UserId =>
        httpContextAccessor.HttpContext?.User.FindFirstValue("sub")
        ?? throw new InvalidOperationException(
            "No 'sub' claim on the authenticated principal. Check Keycloak token mapping and JwtBearerOptions.MapInboundClaims.");
}
