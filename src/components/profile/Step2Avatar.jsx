import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import FileUpload from "@/components/FileUpload";

const avatars = [
  "avatar-1",
  "avatar-2",
  "avatar-3",
  "avatar-4",
  "avatar-5",
  "avatar-6",
  "avatar-7",
  "avatar-8",
  "avatar-9",
  "avatar-10",
  "avatar-11",
  "avatar-12",
];
const getAvatarEmoji = (id) =>
  ({
    "avatar-1": "👨🏻",
    "avatar-2": "👩🏻",
    "avatar-3": "👨🏽",
    "avatar-4": "👩🏽",
    "avatar-5": "👨🏿",
    "avatar-6": "👩🏿",
    "avatar-7": "👦🏻",
    "avatar-8": "👧🏽",
    "avatar-9": "👨🏿‍🦱",
    "avatar-10": "👩🏿‍🦱",
    "avatar-11": "👨🏽‍🦲",
    "avatar-12": "👩🏿‍🦲",
  }[id] || "👤");

export const Step2Avatar = ({
  profileData,
  setProfileData,
  onFileSelect,
  previewUrl,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-bold">
          Choose an Avatar or Upload a Photo
        </h2>
        <p className="text-gray-600">This is how you'll appear in the app.</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {avatars.map((avatarId) => (
          <button
            key={avatarId}
            onClick={() => {
              setProfileData((p) => ({ ...p, avatar: avatarId }));
              onFileSelect(null, true);
            }}
            className="relative text-5xl bg-gray-100 rounded-full aspect-square flex items-center justify-center"
          >
            {getAvatarEmoji(avatarId)}
            {profileData.avatar === avatarId && (
              <div className="absolute top-0 right-0 h-5 w-5 bg-primary rounded-full flex items-center justify-center text-white">
                <Check size={12} />
              </div>
            )}
          </button>
        ))}
      </div>
      <FileUpload onFileSelect={onFileSelect} previewUrl={previewUrl} />
    </motion.div>
  );
};
