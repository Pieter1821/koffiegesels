using System.ComponentModel.DataAnnotations;

namespace Koffiegesels.Api.Shared.Dev;

public class DevUserOptions
{
    public const string SectionName = "DevUser";

    [Required]
    [StringLength(256)]
    public string UserId { get; set; } = "dev-local-user";
}

public interface ICurrentUser
{
    string UserId { get; }
}

public sealed class DevCurrentUser(Microsoft.Extensions.Options.IOptions<DevUserOptions> options)
    : ICurrentUser
{
    public string UserId => options.Value.UserId;
}
