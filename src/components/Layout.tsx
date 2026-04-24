import { Outlet } from 'react-router-dom'
import ServerRail from './ServerRail'
import ChannelSidebar from './ChannelSidebar'

export default function Layout() {
  return (
    <div className="flex h-screen w-screen bg-velocity-bg">
      <ServerRail />
      <ChannelSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
