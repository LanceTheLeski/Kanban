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
builder.Services.AddTransient<ITagRepository, TagRepository> ();

builder.Services.AddControllers()
                .AddNewtonsoftJson ();

builder.Services.AddAntiforgery ();
builder.Services.AddHttpClient ();

builder.Services.Configure<AzureTableOptions> (builder.Configuration.GetSection ("AzureTables"));

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
	// The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
	app.UseHsts();
};

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