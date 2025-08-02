import { useState } from 'react';

function Settings() {
  const [language, setLanguage] = useState('FR');

  return (
    <div>
      <label htmlFor="language">Language: </label>
      <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="FR">FR</option>
        <option value="EN">EN</option>
      </select>
    </div>
  );
}

export default Settings;
