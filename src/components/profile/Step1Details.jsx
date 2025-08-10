import React from "react";
import { motion } from "framer-motion";
import { MapPin, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ErrorMessage = ({ error }) =>
  error ? (
    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
      <AlertCircle size={14} /> {error}
    </p>
  ) : null;

export const Step1Details = ({
  profileData,
  setProfileData,
  errors,
  validateField,
  checkUsername,
  usernameChecking,
  districts,
  subCounties,
  loadingDistricts,
  loadingSubCounties,
  isNewDependent,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div>
        <label className="text-gray-800 font-medium">
          Full Name or Nickname
        </label>
        <Input
          placeholder="Enter name"
          value={profileData.fullName}
          onChange={(e) => {
            setProfileData((p) => ({ ...p, fullName: e.target.value }));
            validateField("fullName", e.target.value);
          }}
        />
        <ErrorMessage error={errors.fullName} />
      </div>
      <div>
        <label className="text-gray-800 font-medium">Username</label>
        <div className="relative">
          <Input
            placeholder="Choose a username"
            value={profileData.username}
            onChange={(e) =>
              setProfileData((p) => ({ ...p, username: e.target.value }))
            }
            onBlur={() => checkUsername(profileData.username)}
          />
          {usernameChecking && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>
        <ErrorMessage error={errors.username} />
      </div>
      <div>
        <label className="text-gray-800 font-medium">Birth Date</label>
        <input
          type="date"
          value={profileData.birthDate}
          onChange={(e) => {
            setProfileData((p) => ({ ...p, birthDate: e.target.value }));
            validateField("birthDate", e.target.value);
          }}
          max={new Date().toISOString().split("T")[0]}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <ErrorMessage error={errors.birthDate} />
      </div>
      <div>
        <label className="text-gray-800 font-medium">Gender</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["Male", "Female", "Other", "Prefer not to say"].map((gender) => (
            <button
              key={gender}
              onClick={() => {
                setProfileData((p) => ({ ...p, gender }));
                validateField("gender", gender);
              }}
              className={`p-3 rounded-lg font-medium border-2 text-sm ${
                profileData.gender === gender
                  ? "bg-primary/10 text-primary border-primary"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
        <ErrorMessage error={errors.gender} />
      </div>

      {!isNewDependent && (
        <div>
          <label className="text-gray-800 font-medium flex items-center">
            <MapPin className="w-4 h-4 mr-2" /> Location
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Select
              value={profileData.district}
              onValueChange={(v) => {
                setProfileData((p) => ({ ...p, district: v, subCounty: "" }));
                validateField("district", v);
              }}
              disabled={loadingDistricts}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingDistricts ? "Loading..." : "District"}
                />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={profileData.subCounty}
              onValueChange={(v) =>
                setProfileData((p) => ({ ...p, subCounty: v }))
              }
              disabled={!profileData.district || loadingSubCounties}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingSubCounties ? "Loading..." : "Sub County (Optional)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subCounties.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ErrorMessage error={errors.district} />
        </div>
      )}
    </motion.div>
  );
};
