using ApexCharts;
using ArcStrides.Contracts.Response;
using ArcStrides.UI;
using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Layouts.Board.Column;
using ArcStrides.UI.Options;
using ArcStrides.UI.Repositories;
using ArcStrides.UI.Services;
using Microsoft.Extensions.DependencyInjection.Extensions;
using MudBlazor.Services;

var builder = WebApplication.CreateBuilder (args);

// Add services to the container.
builder.Services.AddRazorComponents ()
                .AddInteractiveServerComponents ();

builder.Services.AddMudServices ();
builder.Services.AddHttpClient ();

builder.Services.Configure<ArcStridesServiceOptions> (builder.Configuration.GetSection ("InternalAPI"));

builder.Services.AddTransient<CreateColumnOverlay> ();

builder.Services.AddTransient<IArcErrorHandler, ArcErrorHandler> ();
builder.Services.AddTransient<IArcStridesService<CardResponse>, ArcStridesService<CardResponse>> ();
builder.Services.AddTransient<IArcStridesService<CardPositionResponse>, ArcStridesService<CardPositionResponse>> ();
builder.Services.AddTransient<IArcStridesService<BoardResponse>, ArcStridesService<BoardResponse>> (); 
builder.Services.AddTransient<IArcStridesService<ColumnResponse>, ArcStridesService<ColumnResponse>> ();
builder.Services.AddTransient<IArcStridesService<SwimlaneResponse>, ArcStridesService<SwimlaneResponse>> ();

builder.Services.AddSingleton<ArcStridesServiceExtensions<ColumnResponse>> ();
builder.Services.TryAddSingleton<IArcStridesServiceFactory<ColumnResponse>> (serviceProvider => serviceProvider.GetRequiredService<ArcStridesServiceExtensions<ColumnResponse>> ());
//builder.Services.AddTransient<IArcStridesServiceFactory<ColumnResponse>, ArcStridesServiceExtensions<ColumnResponse>> ();

builder.Services.AddTransient<IBoardRepository, BoardRepository> ();
builder.Services.AddTransient<IColumnRepository, ColumnRepository> ();
builder.Services.AddTransient<ICardRepository, CardRepository> ();
builder.Services.AddTransient<ITaskRepository, TaskRepository> ();

var app = builder.Build ();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment ())
{
    app.UseExceptionHandler ("/ArcStrides/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts ();
}

app.UseHttpsRedirection ();

app.UseStaticFiles ();
app.UseAntiforgery ();

app.MapRazorComponents<App> ()
   .AddInteractiveServerRenderMode ();//Change to server

app.Run ();