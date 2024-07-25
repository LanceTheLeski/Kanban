using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Kanban.UI.Components.Pages;

public partial class Home : ComponentBase
{
    MudTheme _kanbanBoardDefaultTheme = new MudTheme
    {
        PaletteLight = new PaletteLight
        {
            BackgroundGray = "#0F83DB",
            Background = "#69B4EC",

            AppbarBackground = "#F0EDE0",

            Primary = "#56EBEC",
            Secondary = "#56EBEC",
            Tertiary = "#56EBEC"
        }

    };
}