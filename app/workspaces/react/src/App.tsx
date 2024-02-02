import './App.scss'
import _ from 'lodash'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const App = () => {
	return <main className="App"></main>
}

export const Router = () => {
	return (
		<RouterProvider
			router={createBrowserRouter([
				{
					path: '/inventory',
					element: <App />,
				},
			])}
		/>
	)
}
