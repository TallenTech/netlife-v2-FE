import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const LoadingButton = ({ isLoading, loadingText, children, ...props }) => (
  <Button {...props} disabled={isLoading || props.disabled}>
    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
    {isLoading ? loadingText : children}
  </Button>
);

export default LoadingButton;
