const DATA_FILES = {
  profile: "profile.csv",
  education: "education.csv",
  experience: "experience.csv",
  projects: "projects.csv",
  skills: "skills.csv",
  tools: "tools.csv"
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(value.trim());
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (value !== "" || row.length > 0) {
    row.push(value.trim());
    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows.shift();
  return rows.map((cells) => headers.reduce((record, header, index) => {
    record[header] = cells[index] || "";
    return record;
  }, {}));
}

async function loadCsv(fileName) {
  const response = await fetch(fileName);
  if (!response.ok) {
    throw new Error(`Unable to load ${fileName}: ${response.status}`);
  }
  return parseCsv(await response.text());
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

function renderProfile(profileRows) {
  const profile = profileRows.reduce((record, row) => {
    record[row.key] = row.value;
    return record;
  }, {});

  document.querySelectorAll("[data-profile]").forEach((element) => {
    element.textContent = profile[element.dataset.profile] || "";
  });

  document.querySelectorAll("[data-profile-link]").forEach((element) => {
    const value = profile[element.dataset.profileLink];
    if (value) {
      element.href = value;
    } else {
      element.hidden = true;
    }
  });

  if (profile.name) {
    document.title = `${profile.name} | Portfolio`;
  }
}

function renderRecords(records, container) {
  records.forEach((record) => {
    const item = createElement("article", "record");
    const period = createElement("div", "record-period", record.period);
    const details = createElement("div");
    const title = createElement("h3", "", record.title);
    const organization = createElement("span", "", ` / ${record.organization}`);
    title.append(organization);
    details.append(title, createElement("p", "", record.description));
    item.append(period, details);
    container.append(item);
  });
}

function renderProjects(projects, container) {
  projects.forEach((project, index) => {
    const item = createElement("article", "project");
    item.append(
      createElement("div", "project-index", String(index + 1).padStart(2, "0")),
      createElement("div")
    );
    const details = item.lastElementChild;
    const title = createElement("h3");
    const link = createElement("a", "project-title-link", project.title);
    link.href = `project.html?slug=${encodeURIComponent(project.slug)}`;
    title.append(link);
    details.append(title);
    if (project.status) {
      details.append(createElement("span", "project-status", project.status));
    }
    details.append(createElement("p", "", project.description));
    if (project.tools) {
      details.append(createElement("p", "project-tools", project.tools));
    }
    container.append(item);
  });
}

function renderSkills(skills, container) {
  const groupedSkills = skills.reduce((groups, skill) => {
    if (!groups[skill.category]) {
      groups[skill.category] = [];
    }
    groups[skill.category].push(skill);
    return groups;
  }, {});

  Object.entries(groupedSkills).forEach(([category, categorySkills]) => {
    const group = createElement("div", "skill-group");
    const list = createElement("div", "skill-items");
    group.append(
      createElement("h3", "", category),
      list
    );
    categorySkills.forEach((skill) => {
      const item = createElement("div", "skill-item");
      item.append(
        createElement("strong", "", skill.name),
        createElement("span", "", skill.detail || skill.level || "")
      );
      list.append(item);
    });
    container.append(group);
  });
}

function renderTools(tools, container) {
  tools.forEach((tool) => {
    const item = createElement("article", "tool-item");
    item.append(
      createElement("h3", "", tool.name),
      createElement("p", "", tool.description)
    );
    container.append(item);
  });
}

function renderProjectDetail(projects) {
  const slug = new URLSearchParams(window.location.search).get("slug");
  const project = projects.find((item) => item.slug === slug);
  const detail = document.querySelector("[data-project-detail]");

  if (!project) {
    detail.innerHTML = '<p class="status-message">This project could not be found.</p>';
    return;
  }

  document.title = `${project.title} | Portfolio`;
  document.querySelectorAll("[data-project]").forEach((element) => {
    element.textContent = project[element.dataset.project] || "";
  });

  const meta = document.querySelector("[data-project-meta]");
  [project.status, project.period, project.tools].filter(Boolean).forEach((value) => {
    meta.append(createElement("span", "", value));
  });

  const repositoryLink = document.querySelector('[data-project-link="repository"]');
  if (project.repository) {
    repositoryLink.href = project.repository;
  } else {
    repositoryLink.hidden = true;
  }
}

async function renderPortfolio() {
  const data = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, fileName]) => [key, await loadCsv(fileName)])
  );
  const sections = Object.fromEntries(data);

  renderProfile(sections.profile);
  renderRecords(sections.education, document.querySelector('[data-section="education"]'));
  renderRecords(sections.experience, document.querySelector('[data-section="experience"]'));
  renderProjects(sections.projects, document.querySelector('[data-section="projects"]'));
  renderSkills(sections.skills, document.querySelector('[data-section="skills"]'));
  renderTools(sections.tools, document.querySelector('[data-section="tools"]'));
}

async function renderProjectPage() {
  const projects = await loadCsv(DATA_FILES.projects);
  renderProjectDetail(projects);
}

const renderPage = document.body.dataset.page === "project" ? renderProjectPage : renderPortfolio;

renderPage().catch((error) => {
  console.error("Portfolio data could not be rendered.", error);
  document.querySelectorAll("[data-section]").forEach((section) => {
    section.innerHTML = '<p class="status-message">Portfolio data could not be loaded. Please try again later.</p>';
  });
});
