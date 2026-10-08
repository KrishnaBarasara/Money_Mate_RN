import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";

type ToastType = "success" | "error" | "info";

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("success");

  const showToast = useCallback((msg: string, toastType: ToastType = "success") => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        visible={visible}
        message={message}
        type={type}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

