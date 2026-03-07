/*import './App.css'*/
import { ThemeProvider, CssBaseline } from '@mui/material'
import { ArcErrorDisplay } from './Components/ArcErrorDisplay'
import { ComponentDemo } from './Features/demo/ComponentDemo'
import { arcTheme } from './Styles/Theme'
import './Styles/ArcStyles.css'

function App()
{
	return (
        <ThemeProvider theme={arcTheme}>
            {/*
                CssBaseline normalizes browser styles.
                MUI equivalent of the Blazor default CSS reset.
            */}
            <CssBaseline />

            {/*
                ArcErrorDisplay wraps the app so useArcError() is available everywhere.
                Mirrors: <MudSnackbarProvider /> placement in MainLayout.razor
            */}
            <ArcErrorDisplay>
                <ComponentDemo />
            </ArcErrorDisplay>
        </ThemeProvider>
	)
}

export default App