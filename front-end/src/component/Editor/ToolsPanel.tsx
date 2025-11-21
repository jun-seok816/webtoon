import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Editor } from "./Layout";
import "./ToolsPanel.scss";

interface ToolsPanelProps {
  editor: Editor;
}

const tools = [
  { id: "crop", icon: "bi-crop", label: "Crop Tool (C)" },  
  { id: "text", icon: "bi-type", label: "Text Tool (T)" },
];

const ToolsPanel: React.FC<ToolsPanelProps> = ({ editor }) => {
  const toolStore = editor.tools;
  const activeTool = toolStore.activeTool;
  const navigate = useNavigate();
  const loginStore = editor.loginStore;
  const session = loginStore.pt_session;
  const isLoggingOut = loginStore.pt_isLoggingOut;
  const isLoggedIn = session?.loggedIn ?? false;

  useEffect(() => {
    if (loginStore.pt_session == null) {
      void loginStore.im_GetSession();
    }
  }, [loginStore]);

  const handleLogout = async () => {
    if (loginStore.pt_isLoggingOut) return;
    try {
      const { err } = await loginStore.im_Logout();
      if (err) {
        throw new Error("로그아웃에 실패했습니다.");
      }
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="tools-panel">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`tool-button ${activeTool === tool.id ? "active" : ""}`}
          onClick={() => toolStore.setActiveTool(tool.id)}
          title={tool.label}
        >
          <i className={`bi ${tool.icon}`} aria-hidden="true" />
        </button>
      ))}
      <div className="tool-divider" />

      <button
        type="button"
        className="tool-button tool-button--logout"
        onClick={handleLogout}
        disabled={isLoggingOut}
        title="로그아웃"
      >
        <i className="bi bi-box-arrow-right" aria-hidden="true" />
      </button>
    </div>
  );
};

export default ToolsPanel;
