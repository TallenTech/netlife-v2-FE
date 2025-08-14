import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarEmoji } from '@/lib/utils';


const ConfettiPiece = () => {
  const colors = ['#8E3BFF', '#1BDEDA', '#C9F299', '#f87171'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomX = Math.random() * 100;
  const randomDelay = Math.random() * 2;
  const randomDuration = 2 + Math.random() * 2;
  const randomRotate = Math.random() * 360;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${randomX}%`,
        top: '-20px',
        width: '10px',
        height: '10px',
        backgroundColor: randomColor,
        borderRadius: '50%'
      }}
      animate={{
        y: '120vh',
        x: (Math.random() - 0.5) * 400,
        rotate: randomRotate + 360,
      }}
      transition={{
        duration: randomDuration,
        ease: "linear",
        delay: randomDelay,
        repeat: Infinity,
        repeatType: 'loop'
      }}
    />
  );
};

const SuccessConfirmation = ({ onClose, userData }) => {
  const firstName = (userData?.full_name || userData?.username)?.split(' ')[0] || '';

  const renderAvatar = () => {
    if (userData?.profilePhoto) {
        return <AvatarImage src={userData.profilePhoto} alt={userData.full_name || userData.username} />
    }
    if (userData?.avatar) {
        return <AvatarFallback className="text-4xl bg-white/30">{getAvatarEmoji(userData.avatar)}</AvatarFallback>
    }
    return <AvatarFallback className="text-4xl bg-white/30">{firstName.charAt(0).toUpperCase()}</AvatarFallback>
  }


  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <AnimatePresence>
            {[...Array(50)].map((_, i) => <ConfettiPiece key={i} />)}
        </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="bg-gradient-to-br from-primary to-secondary-teal p-8 rounded-2xl text-white text-center shadow-2xl max-w-sm w-full relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
          <X size={24} />
        </button>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
          className="mb-6"
        >
            <Avatar className="h-24 w-24 mx-auto border-4 border-white">
                {renderAvatar()}
            </Avatar>
        </motion.div>
        <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">Thank You, {firstName}!</h2>
        <p className="text-lg opacity-90 drop-shadow">Your service request has been submitted successfully. We will be in touch shortly.</p>
      </motion.div>
    </div>
  );
};

export default SuccessConfirmation;