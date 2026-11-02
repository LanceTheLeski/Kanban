using ArcStrides.Contracts.Response;
using ArcStrides.UI;
using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Layouts.Board.Card;
using ArcStrides.UI.Layouts.Board.Column;
using ArcStrides.UI.Layouts.Board.Swimlane;
using ArcStrides.UI.Layouts.Board.Task;
using ArcStrides.UI.Mappers;
using ArcStrides.UI.Options;
using ArcStrides.UI.Repositories;
using ArcStrides.UI.Services;
using MudBlazor.Services;

var builder = WebApplication.CreateBuilder (args);

// Add services to the container.
builder.Services.AddRazorComponents ()
                .AddInteractiveServerComponents ();

builder.Services.AddMudServices ();
builder.Services.AddHttpClient ();

builder.Services.Configure<ArcStridesServiceOptions> (builder.Configuration.GetSection ("InternalAPI"));

builder.Services.AddTransient<CreateColumnOverlay> ();
builder.Services.AddTransient<UpdateColumnOverlay> ();
builder.Services.AddTransient<DeleteColumnOverlay> ();
builder.Services.AddTransient<CreateSwimlaneOverlay> ();
builder.Services.AddTransient<UpdateSwimlaneOverlay> ();
builder.Services.AddTransient<DeleteSwimlaneOverlay> ();
builder.Services.AddTransient<CreateCardOverlay> ();
builder.Services.AddTransient<UpdateCardOverlay> ();
builder.Services.AddTransient<UpdateTaskPopover> ();

builder.Services.AddTransient<IArcErrorHandler, ArcErrorHandler> ();

builder.Services.AddTransient<IArcStridesService<CardResponse>, ArcStridesService<CardResponse>> ();
builder.Services.AddTransient<IArcStridesService<CardPositionResponse>, ArcStridesService<CardPositionResponse>> ();
builder.Services.AddTransient<IArcStridesService<BoardResponse>, ArcStridesService<BoardResponse>> (); 
builder.Services.AddTransient<IArcStridesService<ColumnResponse>, ArcStridesService<ColumnResponse>> ();
builder.Services.AddTransient<IArcStridesService<SwimlaneResponse>, ArcStridesService<SwimlaneResponse>> ();
builder.Services.AddTransient<IArcStridesService<TaskResponse>, ArcStridesService<TaskResponse>> ();
builder.Services.AddTransient<IArcStridesService<TaskTypeResponse>, ArcStridesService<TaskTypeResponse>> ();
builder.Services.AddTransient<IArcStridesService<TimelineResponse>, ArcStridesService<TimelineResponse>> ();
builder.Services.AddTransient<IArcStridesService<TagResponse>, ArcStridesService<TagResponse>> ();
builder.Services.AddTransient<IArcStridesService<TagGroupResponse>, ArcStridesService<TagGroupResponse>> ();
builder.Services.AddTransient<IArcStridesService<MonthResponse>, ArcStridesService<MonthResponse>> ();
builder.Services.AddTransient<IArcStridesService<DateResponse>, ArcStridesService<DateResponse>> ();

builder.Services.AddTransient<IBoardRepository, BoardRepository> ();
builder.Services.AddTransient<IColumnRepository, ColumnRepository> ();
builder.Services.AddTransient<ISwimlaneRepository, SwimlaneRepository> ();
builder.Services.AddTransient<ICardRepository, CardRepository> ();
builder.Services.AddTransient<ITaskRepository, TaskRepository> ();
builder.Services.AddTransient<ITimelineRepository, TimelineRepository> ();
builder.Services.AddTransient<ITagRepository, TagRepository> ();
builder.Services.AddTransient<ICalendarRepository, CalendarRepository> ();

builder.Services.AddScoped<DateMapper> ();
builder.Services.AddScoped<CardMapper> ();
builder.Services.AddScoped<TaskMapper> ();

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