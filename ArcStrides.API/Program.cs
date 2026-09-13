using ArcStrides.API.Calendars.Mappers;
using ArcStrides.API.Mappers;
using ArcStrides.API.Options;
using ArcStrides.API.Repositories;
using ArcStrides.API.Validators;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Request.Query;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.AspNetCore.Mvc.NewtonsoftJson;
using Microsoft.Extensions.Options;
using System.Text.Json;

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

// Everything serializes through System.Text.Json, with one exception.
//
// JsonPatchDocument<T> is a Newtonsoft type: on .NET 9 it can only be model-bound
// by NewtonsoftJsonPatchInputFormatter, so every [FromBody] JsonPatchDocument<T>
// action would fail to bind without it. This is Microsoft's documented hybrid —
// insert only the patch input formatter at the front of the chain and leave the
// rest of the pipeline on System.Text.Json.
//
// Responses use camelCase so JavaScript clients (arcstrides.ui) get idiomatic
// property names. STJ's CamelCase policy lowercases only the leading run of
// capitals, exactly as Json.NET's did, so `ID` stays `id` and `ColumnID` stays
// `columnID` — the wire shape is unchanged by this swap.
//
// Patch paths ("/Title") keep working: the patch document is still applied by
// Newtonsoft, which matches members case-insensitively.
builder.Services.AddControllers (options =>
                {
                    options.InputFormatters.Insert (0, CreateJsonPatchInputFormatter ());
                })
                .AddJsonOptions (options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                });

// Serves the OpenAPI document at /openapi/v1.json. It reads the System.Text.Json
// options above, which is why the swap matters: while responses were serialized by
// Newtonsoft the generated schema described casing the API did not actually emit.
//
// arcstrides.ui generates its wire-shape interfaces from this document —
// see arcstrides.ui/package.json, `npm run generate:api`.
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

/// <summary>
/// Builds the Newtonsoft input formatter that JsonPatchDocument&lt;T&gt; binding requires.
///
/// It is constructed from a throwaway MVC pipeline because NewtonsoftJsonPatchInputFormatter
/// has no public constructor that takes the services it needs — this is the approach
/// Microsoft documents for keeping JSON Patch on Newtonsoft while the rest of the app
/// uses System.Text.Json.
/// </summary>
static NewtonsoftJsonPatchInputFormatter CreateJsonPatchInputFormatter ()
{
    var builder = new ServiceCollection ()
        .AddLogging ()
        .AddMvc ()
        .AddNewtonsoftJson ()
        .Services.BuildServiceProvider ();

    return builder
        .GetRequiredService<IOptions<MvcOptions>> ()
        .Value
        .InputFormatters
        .OfType<NewtonsoftJsonPatchInputFormatter> ()
        .First ();
}
