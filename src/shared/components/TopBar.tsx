import { Download, Mail, Moon, Search, Upload } from "lucide-react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

export function TopBar({
  activeView,
  search,
  onSearch,
  onNavigate,
  onImport,
  onExport
}: {
  activeView: "library" | "popup" | "import" | "detail" | "diff";
  search: string;
  onSearch: (value: string) => void;
  onNavigate: (view: "library" | "popup") => void;
  onImport: () => void;
  onExport: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark">FH</span><span>FH Prompt Manager</span></div>
      <nav className="top-tabs">
        <button className={activeView === "library" ? "tab active" : "tab"} onClick={() => onNavigate("library")}>资产库</button>
        <button className={activeView === "popup" ? "tab active" : "tab"} onClick={() => onNavigate("popup")}>Fast Use</button>
      </nav>
      <label className="top-search">
        <Search className="icon" />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="搜索标题、标签、正文" />
      </label>
      <div className="top-actions">
        <Button onClick={onImport}><Upload className="icon" />导入</Button>
        <Button onClick={onExport}><Download className="icon" />导出</Button>
        <Button onClick={() => window.location.href = "mailto:author@example.com"}><Mail className="icon" />联系作者</Button>
        <IconButton label="切换明暗模式" icon={<Moon className="icon" />} />
      </div>
    </header>
  );
}
