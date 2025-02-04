using ArcStrides.API.Attributes;
using System.Reflection;

namespace System;

public static class ArcEntityExtensions
{
    public static string? GetArcTableName (this Type arcEntityType)
    {
        var typeAttribute = arcEntityType.GetCustomAttribute<ArcTableNameAttribute> ();

        return typeAttribute?.GetArcTableName ();
    }
}