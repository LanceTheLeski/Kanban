using ArcStrides.API.Calendars.Mappers;
using ArcStrides.API.Mappers;
using ArcStrides.API.Options;
using ArcStrides.API.Repositories;
using ArcStrides.API.Validators;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Request.Query;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson;

var builder = WebApplication.CreateBuilder (args);

/*builder.Services.AddScoped<IValidator<ColumnCreateRequest>, ColumnValidators.ColumnCreateRequestValidator> ();
builder.Services.AddScoped<IValidator<JsonPatchDocument<ColumnPatchRequest>>, ColumnValidators.ColumnPatchRequestDocumentValidator> ();
builder.Services.AddScoped<IValidator<CardCreateRequest>, CardValidators.CardCreateRequestValidator> ();
builder.Services.AddScoped<IValidator<TaskQueryParameters>, TaskValidators.TaskQueryParametersValidator> ();
builder.Services.AddScoped<IValidator<TaskCreateRequest>, TaskValidators.TaskCreateRequestValidator> ();
builder.Services.AddScoped<IValidator<TimelineCreateRequest>, TimelineValidators.TimelineCreateRequestValidator> ();
builder.Services.AddScoped<IValidator<JsonPatchDocument<TimelinePatchRequest>>, TimelineValidators.TimelinePatchRequestDocumentValidator> ();
builder.Services.AddScoped<IValidator<TimelinePatchRequest>, TimelineValidators.TimelinePatchRequestValidator> ();
builder.Services.AddScoped<IValidator<TagCreateRequest>, TagValidators.TagCreateRequestValidator> ();
builder.Services.AddScoped<IValidator<JsonPatchDocument<TagPatchRequest>>, TagValidators.TagPatchRequestDocumentValidatorcs> ();*/

builder.Services.AddScoped<ColumnMapper> ();
builder.Services.AddScoped<SwimlaneMapper> ();
builder.Services.AddScoped<DateMapper> ();
builder.Services.AddScoped<CardMapper> ();
builder.Services.AddScoped<TaskMapper> ();
builder.Services.AddScoped<TimelineMapper> ();
builder.Services.AddScoped<TagMapper> ();

builder.Services.AddTransient<IColumnRepository, ColumnRepository> ();
builder.Services.AddTransient<ISwimlaneRepository, SwimlaneRepository> ();
builder.Services.AddTransient<IDateRepository, DateRepository> ();
builder.Services.AddTransient<ICardRepository, CardRepository> ();
builder.Services.AddTransient<ITaskRepository, TaskRepository> ();
builder.Services.AddTransient<ITimelineRepository, TimelineRepository> ();
builder.Services.AddTransient<ITagRepository, TagRepository> ();

// Everything — requests, responses and JSON Patch documents — goes through
// System.Text.Json.
//
// Until .NET 10 that was not possible: JsonPatchDocument<T> was a Newtonsoft type
// that only NewtonsoftJsonPatchInputFormatter could model-bind, so the app had to
// run a hybrid pipeline with that one formatter inserted ahead of the rest.
// Microsoft.AspNetCore.JsonPatch.SystemTextJson replaces it, and Newtonsoft is
// gone from this project entirely.
//
// No JSON configuration is needed. MVC builds its JsonSerializerOptions from
// JsonSerializerDefaults.Web, which already gives us:
//
//   PropertyNamingPolicy      = CamelCase   → `ID` serializes as `id`, `ColumnID`
//                                             as `columnID` (only the leading run
//                                             of capitals is lowercased)
//   PropertyNameCaseInsensitive = true      → inbound bodies bind regardless of casing
//   NumberHandling            = AllowReadingFromString
//
// The equivalent under Newtonsoft had to be set by hand, because its MVC default
// was DefaultContractResolver — PascalCase on the wire.
builder.Services.AddControllers ();

builder.Services.AddOpenApi ();

builder.Services.AddAntiforgery ();
builder.Services.AddHttpClient ();

builder.Services.Configure<AzureTableOptions> (builder.Configuration.GetSection ("AzureTables"));

builder.Services.AddCors (options =>
{
    options.AddPolicy ("DevCors", policy =>
    {
        policy.WithOrigins ("http://localhost:54671", "https://localhost:54671")
              .AllowAnyHeader ()
              .AllowAnyMethod ();
    });
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
	// The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
	app.UseHsts();
};

if (app.Environment.IsDevelopment ())
{
    app.MapOpenApi ();
}

app.UseCors ("DevCors");

app.UseHttpsRedirection ();
app.UseAuthorization ();
app.UseRouting ();
app.MapControllers ();
app.MapControllerRoute 
(
	name: "default",
	pattern: "{controller=Board}/{action=GetBoard}"
);

app.UseAntiforgery ();

app.Run ();
