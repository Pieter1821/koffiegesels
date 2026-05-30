using Koffiegesels.Api.Features.Conversations;
using Microsoft.EntityFrameworkCore;

namespace Koffiegesels.Api.Data;

public class KoffiegeselsContext(DbContextOptions<KoffiegeselsContext> options)
    : DbContext(options)
{
    public DbSet<Conversation> Conversations => Set<Conversation>();

    public DbSet<Message> Messages => Set<Message>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(KoffiegeselsContext).Assembly);
    }
}
