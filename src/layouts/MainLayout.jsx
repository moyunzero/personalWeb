import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import BlogFooter from '../components/blog/BlogFooter';
import ParticleCanvas from '../components/common/ParticleCanvas';
import MouseTrail from '../components/common/MouseTrail';
import PhaserGame from '../game/PhaserGame';
import GameTooltip from '../game/GameTooltip';
import ChatTrigger from '../components/chat/ChatTrigger';
import ChatPanel from '../components/chat/ChatPanel';

const MainLayout = () => {
    const { pathname } = useLocation();
    const isBlogRoute = pathname === '/blog' || pathname.startsWith('/blog/');

    return (
        <>
            <ParticleCanvas />
            <MouseTrail />
            {!isBlogRoute && (
                <>
                    <PhaserGame />
                    <GameTooltip />
                    <ChatTrigger />
                </>
            )}
            <ChatPanel />
            {!isBlogRoute && <Header />}
            <Outlet />
            {isBlogRoute ? <BlogFooter /> : <Footer />}
        </>
    );
};

export default MainLayout; 