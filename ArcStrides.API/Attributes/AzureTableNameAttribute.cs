namespace ArcStrides.API.Attributes;

[AttributeUsage (AttributeTargets.All, AllowMultiple = true)]
public class AzureTableNameAttribute : Attribute
{
    public readonly string Warning;

    public AzureTableNameAttribute (string warning)
    {
        Warning = warning;
    }
}