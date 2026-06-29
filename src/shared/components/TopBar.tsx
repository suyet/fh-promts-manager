import { Download, Info, Search, Upload, X } from "lucide-react";
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
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    setDraft(search);
  }, [search]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(draft);
  }

  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-logo" src="/icons/fh-pm-logo.png" alt="FH Prompt Manager logo" />
        <span className="brand-name">FH Prompt Manager</span>
      </div>
      <form className="top-search-form" role="search" onSubmit={submitSearch}>
        <div className="top-search">
          <Search className="icon" />
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="搜索标题、标签、正文" />
        </div>
        <button className="search-submit" type="submit" aria-label="搜索">
          搜索
        </button>
      </form>
      <div className="top-actions">
        <Button className="top-action-button" onClick={onImport}><Upload className="icon" />导入</Button>
        <Button className="top-action-button" onClick={onExport}><Download className="icon" />导出</Button>
        <Button className="top-action-button" onClick={() => setShowContact(true)}><Info className="icon" />关于应用</Button>
      </div>
      {showContact && (
        <div className="modal-backdrop">
          <section className="modal contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-title">
            <div className="modal-head">
              <h2 id="contact-title">关于应用</h2>
              <IconButton label="关闭" icon={<X className="icon" />} onClick={() => setShowContact(false)} />
            </div>
            <div className="contact-lines">
              <p className="contact-intro">开源的，完全离线的本地提示词管理插件(支持chrome/edge)</p>
              <p className="contact-subtitle">核心亮点：</p>
              <ul className="contact-features">
                <li>🧩 三重颗粒度的提示词资产管理</li>
                <li>🖼️ 支持问生图类型提示词、版本diff对比</li>
                <li>🔒 本地优先，完全离线</li>
                <li>📦 一键导入导出，团队共享</li>
              </ul>
              <div className="contact-warning">
                <p className="contact-warning-title">提醒：</p>
                <ol className="contact-warning-list">
                  <li>删除插件将<span className="contact-warning-danger">删除全部数据</span>，请提前导出备份</li>
                  <li>请不要移动插件源文件的位置</li>
                </ol>
              </div>
              <p>👤 作者：烽火技服-姜萌</p>
              <p>📧 邮箱：mjiang@fiberhome.com</p>
            </div>
          </section>
        </div>
      )}
    </header>
  );
}
