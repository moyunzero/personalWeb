import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ParticleCanvas from '../components/common/ParticleCanvas';
import MouseTrail from '../components/common/MouseTrail';
import PhaserGame from '../game/PhaserGame';
import GameTooltip from '../game/GameTooltip';
import ChatTrigger from '../components/chat/ChatTrigger';
import ChatPanel from '../components/chat/ChatPanel';

const MainLayout = () => {
    return (
        <>
            <ParticleCanvas />
            <MouseTrail />
            <PhaserGame />
            <GameTooltip />
            <ChatTrigger />
            <ChatPanel />
            <Header />
            <Outlet />
            <Footer />
        </>
    );
};

export default MainLayout; 