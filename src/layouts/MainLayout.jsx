import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ParticleCanvas from '../components/common/ParticleCanvas';
import MouseTrail from '../components/common/MouseTrail';
import PhaserGame from '../game/PhaserGame';

const MainLayout = () => {
    return (
        <>
            <ParticleCanvas />
            <MouseTrail />
            <PhaserGame />
            <Header />
            <Outlet />
            <Footer />
        </>
    );
};

export default MainLayout; 