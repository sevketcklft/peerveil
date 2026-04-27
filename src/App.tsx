import { PeerProvider, usePeer } from './context/PeerContext';
import { Lobby } from './components/Lobby';
import { Room } from './components/Room';
import { motion, AnimatePresence } from 'framer-motion';

const AppContent = () => {
  const { myStream } = usePeer();

  
  
  

  
  

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black pointer-events-none" />

      <AnimatePresence mode="wait">
        {!myStream ? (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="z-10 w-full flex justify-center"
          >
            <Lobby />
          </motion.div>
        ) : (
          <motion.div
            key="room"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="z-10 w-full h-full"
          >
            <Room />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <PeerProvider>
      <AppContent />
    </PeerProvider>
  );
}

export default App;
