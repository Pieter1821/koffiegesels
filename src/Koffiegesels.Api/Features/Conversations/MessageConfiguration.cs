using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Koffiegesels.Api.Features.Conversations;

internal sealed class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasKey(m => m.Id);

        // Store the role as a readable string rather than an int.
        builder.Property(m => m.Role)
               .HasConversion<string>()
               .HasMaxLength(32)
               .IsRequired();

        builder.Property(m => m.Content)
               .IsRequired();

        builder.Property(m => m.CreatedAt).IsRequired();

        // Load a conversation's messages in chronological order.
        builder.HasIndex(m => new { m.ConversationId, m.CreatedAt });
    }
}
