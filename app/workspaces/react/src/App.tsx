import './App.scss'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import { supported } from 'browser-fs-access'
import { Button, Form, Input, Badge } from 'antd'
import {
	createBrowserRouter,
	RouterProvider,
	useSearchParams,
} from 'react-router-dom'

const App = () => {
	const [form] = Form.useForm()
	const [isSessionLoaded, setIsSessionLoaded] = useState(true)
	const [sessionItemCountMap, setSessionItemCountMap] = useState<{
		[x: string]: Awaited<ReturnType<typeof getSessionItemCount>>
	}>()
	const [searchParams, setSearchParams] = useSearchParams()
	const [user, setUser] = useState<User | undefined>()
	const [session, setSession] = useSession()
	// const [session, setSession] = useState<Session | undefined>()
	const [sessionList, setSessionList] = useState<Session[] | undefined>()

	const [inventoryData, setInventoryData] = useInventoryData()

	console.log({ inventoryData })

	const viewSession = (session: Session) => {
		setIsSessionLoaded(false)

		getSession(session.id).then((items) => {
			console.log({ _____items: items })

			if (items) {
				setIsSessionLoaded(true)
				setInventoryData(items)
			}
		})
	}

	const onSessionCreateForm = async ({
		sessionName,
	}: {
		sessionName: string
	}) => {
		if (user && user.username) {
			const session = await createSession(user.username, sessionName)

			if (session)
				if (!searchParams.has('session')) {
					searchParams.set('session', session.id)
				} else {
					searchParams.delete('session')
					searchParams.set('session', session.id)
				}

			setSearchParams(searchParams)

			if (session) {
				setSession(session)
				console.log({ session })
			}
		}
	}

	const setSessionByButton = (session: Session) => {
		if (user) viewSession(session)
		setSession(session)
	}

	const updateSessionStuff = (isExternal: boolean) => {
		getSessionList(searchParams.get('login')!).then(async (sessionList) => {
			console.log({ sessionList })

			if (sessionList && sessionList.statusCode === undefined) {
				console.log({ SESSION_LIST: sessionList })

				if (sessionList && sessionList.length !== 0) {
					setSessionList(sessionList)

					const m: {
						[x: string]: Awaited<ReturnType<typeof getSessionItemCount>>
					} = {}

					await Promise.all(
						sessionList.map(async (session) => {
							const count = await getSessionItemCount(session.id)
							console.log({ session, count })

							if (count) m[session.id] = count
						}),
					)

					console.log({ m })

					setSessionItemCountMap(m)
				}

				if (isExternal) {
					if (searchParams.has('session') && sessionList) {
						setIsSessionLoaded(false)
						const sessionID = searchParams.get('session')
						const targetSession = sessionList.filter((p) => p.id === sessionID)

						if (sessionID) {
							if (targetSession) setSession(targetSession[0])

							getSession(sessionID).then((items) => {
								if (items) {
									setIsSessionLoaded(true)
									setInventoryData(items.map((e) => e))
								}
							})
						}
					}
				}
			} else {
				console.log('must be reload')
				location.reload()
			}
		})
	}

	useEffect(() => {
		const username = searchParams.get('login')
		if (username) {
			getUser(username).then((a) => {
				console.log({ _user_: a })
				return setUser(a)
			})

			updateSessionStuff(true)
		}

		if (supported) {
			console.log('Using the File System Access API.')
		} else {
			console.log('Using the fallback implementation.')
		}
	}, [])

	console.log({ sessionItemCountMap })

	return (
		<main className="App">
			<Header
				updateSessionStuff={updateSessionStuff}
				isSessionLoaded={isSessionLoaded}
				setSession={setSession}
				username={searchParams.get('login')!}
				session={session}
				inventoryData={inventoryData}
				sett={(inventoryData) => setInventoryData(inventoryData)}
			/>

			{session !== undefined ? (
				inventoryData.length !== 0 ? (
					<InventoryTable
						isSessionLoaded={isSessionLoaded}
						data={inventoryData}
					/>
				) : (
					<></>
				)
			) : (
				<div className="session-list">
					<div className="title">
						<span>Ведомости</span> {'    '}
						<Form
							rootClassName="add-new-session-form"
							form={form}
							name="horizontal_login"
							layout="inline"
							onFinish={onSessionCreateForm}
						>
							<Form.Item
								name="sessionName"
								rules={[
									{ required: true, message: 'Введите название для ведомости' },
								]}
							>
								{/* <Space.Compact style={{ width: '100%' }}> */}
								{/* <Input bordered={false} placeholder="Имя новой сессии" />
							<Button type="primary">Создать</Button> */}
								{/* </Space.Compact> */}
								<Input
									size="small"
									// bordered={false}
									width={'fit-content'}
									// prefix={<UserOutlined className="site-form-item-icon" />}
									placeholder="Имя для ведомости"
								/>
							</Form.Item>

							<Form.Item shouldUpdate>
								{() => (
									<Button size="small" type="primary" htmlType="submit">
										+
									</Button>
								)}
							</Form.Item>
						</Form>
						{/* <Button
						// rootClassName="session-btn"
						onClick={async () => {
							if (username) {
								const session = await createSession(
									username,
									'test_session_name',
								)

								if (session) {
									console.log({ session })
								}
							}
						}}
					>
						+
					</Button> */}
					</div>

					{sessionList && sessionList.length !== 0 && (
						<div className="session-buttons">
							{sessionList &&
								sessionList.length !== 0 &&
								sessionList.map((session, i) => (
									// <Link to={'session'}>{session.name}</Link>

									<Button
										onClick={() => {
											if (!searchParams.has('session')) {
												searchParams.set('session', session.id)
											} else {
												searchParams.delete('session')
												searchParams.set('session', session.id)
											}

											setSearchParams(searchParams)
											return setSessionByButton(session)
										}}
										rootClassName="session-btn"
									>
										<div>
											<div className="name">{session.name}</div>
											<div className="bottom">
												<div className="itemCount">
													{sessionItemCountMap !== undefined &&
														sessionItemCountMap[session.id] !== undefined && (
															<div>
																<Badge
																	className="site-badge-count-109"
																	count={
																		sessionItemCountMap[session.id]?.checked
																	}
																	style={{ backgroundColor: 'rgb(107 196 26)' }}
																/>
																{sessionItemCountMap[session.id]?.all}
															</div>
														)}
													{/* <div>
													<Badge
														className="site-badge-count-109"
														count={60}
														style={{ backgroundColor: 'rgb(107 196 26)' }}
													/>

													{sessionItemCountMap !== undefined &&
														sessionItemCountMap][session.id] !== undefined &&
														sessionItemCountMap[session.id].toString()}
												</div> */}
												</div>

												<div className="date">
													{new Date(session.updatedAt).toLocaleString()}
												</div>
											</div>
										</div>
									</Button>
								))}
						</div>
					)}
				</div>
			)}

			{/* {inventoryData.length !== 0 && <InventoryTable data={inventoryData} />} */}
			{/* <div className="Home-built">Built at: {date}</div> */}
			{/* <Outlet />
      <ReloadPrompt /> */}
			{/* <Tree /> */}
		</main>
	)
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
