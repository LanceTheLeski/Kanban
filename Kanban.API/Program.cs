using FluentValidation;
using Kanban.API.Mappers;
using Kanban.API.Options;
using Kanban.API.Repositories;
using Kanban.API.Validators;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Microsoft.AspNetCore.JsonPatch;

var builder = WebApplication.CreateBuilder (args);

builder.Services.AddScoped<IValidator<ColumnCreateRequest>, ColumnCreateRequestValidator> ();
builder.Services.AddScoped<IValidator<JsonPatchDocument<ColumnPatchRequest>>, ColumnPatchRequestDocumentValidator> ();
builder.Services.AddScoped<IValidator<TagCreateRequest>, TagCreateRequestValidator> ();

builder.Services.AddTransient<IColumnMapper, ColumnMapper> ();
builder.Services.AddTransient<ITaskMapper, TaskMapper> ();
builder.Services.AddTransient<ITagMapper, TagMapper> ();

builder.Services.AddTransient<IBoardRepository, BoardRepository>();
builder.Services.AddTransient<IColumnRepository, ColumnRepository> ();
builder.Services.AddTransient<ISwimlaneRepository, SwimlaneRepository> (); 
builder.Services.AddTransient<ICardRepository, CardRepository> ();
builder.Services.AddTransient<IDateRepository, DateRepository> ();
builder.Services.AddTransient<ITagRepository, TagRepository> ();
builder.Services.AddTransient<ITaskRepository, TaskRepository> ();

builder.Services.AddControllers()
                .AddNewtonsoftJson ();

builder.Services.AddAntiforgery ();
builder.Services.AddHttpClient ();

builder.Services.Configure<CosmosOptions> (builder.Configuration.GetSection ("Cosmos"));

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