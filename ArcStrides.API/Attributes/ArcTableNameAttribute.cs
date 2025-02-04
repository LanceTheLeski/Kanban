namespace ArcStrides.API.Attributes;

/// <summary>
/// The table name to reference for the attached entity. This 
/// name corresponds directly to the table name on Azure Tables.
/// </summary>
[AttributeUsage (AttributeTargets.All, AllowMultiple = true)] //Place more restrictions/verifications here later..
public class ArcTableNameAttribute (string _tableName) : Attribute
{ 
    public string GetArcTableName ()
        => _tableName;
}