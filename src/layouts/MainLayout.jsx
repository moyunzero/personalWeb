import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ParticleCanvas from '../components/common/ParticleCanvas';

const MainLayout = () => {
    return (
        <>
            <ParticleCanvas />
            <Header />
            <Outlet />
            <Footer />
        </>
    );
};

export default MainLayout; 