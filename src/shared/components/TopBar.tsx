import { Download, Mail, Moon, Search, Upload } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

export function TopBar({
  search,
  onSearch,
  onImport,
  onExport
}: {
  search: string;
  onSearch: (value: string) => void;
  onImport: () => void;
  onExport: () => void;
}) {
  const [draft, setDraft] = useState(search);

  useEffect(() => {
    setDraft(search);
  }, [search]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(draft);
  }

  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark">FH</span><span>FH Prompt Manager</span></div>
      <form className="top-search" role="search" onSubmit={submitSearch}>
        <Search className="icon" />
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="搜索标题、标签、正文" />
        <button className="search-submit" type="submit" aria-label="搜索">
          <Search className="icon" />
        </button>
      </form>
      <div className="top-actions">
        <Button onClick={onImport}><Upload className="icon" />导入</Button>
        <Button onClick={onExport}><Download className="icon" />导出</Button>
        <Button onClick={() => window.location.href = "mailto:author@example.com"}><Mail className="icon" />联系作者</Button>
        <IconButton label="切换明暗模式" icon={<Moon className="icon" />} />
      </div>
    </header>
  );
}
