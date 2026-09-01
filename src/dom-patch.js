const FORM_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function patchHtml(target, html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  patchChildren(target, template.content);
}

function patchChildren(currentParent, nextParent) {
  const nextChildren = [...nextParent.childNodes];
  let cursor = currentParent.firstChild;

  for (const nextChild of nextChildren) {
    const key = nodeKey(nextChild);
    let current = cursor;

    if (key) {
      const match = findKeyedNode(currentParent, key, cursor);
      if (match && match !== cursor) currentParent.insertBefore(match, cursor);
      current = match || cursor;
    }

    if (!current) {
      currentParent.appendChild(nextChild.cloneNode(true));
      continue;
    }

    if (!sameNode(current, nextChild)) {
      const replacement = nextChild.cloneNode(true);
      currentParent.insertBefore(replacement, current);
      cursor = replacement.nextSibling;
      continue;
    }

    patchNode(current, nextChild);
    cursor = current.nextSibling;
  }

  while (cursor) {
    const next = cursor.nextSibling;
    currentParent.removeChild(cursor);
    cursor = next;
  }
}

function patchNode(current, next) {
  if (current.nodeType === Node.TEXT_NODE || current.nodeType === Node.COMMENT_NODE) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return;
  }

  syncAttributes(current, next);

  if (FORM_TAGS.has(current.tagName)) {
    syncFormControl(current, next);
    if (current.tagName !== "SELECT") return;
  }

  patchChildren(current, next);
}

function syncAttributes(current, next) {
  for (const attribute of [...current.attributes]) {
    if (!next.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
  }
  for (const attribute of [...next.attributes]) {
    if (current.getAttribute(attribute.name) !== attribute.value) current.setAttribute(attribute.name, attribute.value);
  }
}

function syncFormControl(current, next) {
  const active = document.activeElement === current;
  if (current.tagName === "INPUT") {
    if (current.type === "checkbox" || current.type === "radio") current.checked = next.checked;
    else if (!active && next.hasAttribute("value") && current.value !== next.value) current.value = next.value;
    return;
  }
  if (current.tagName === "TEXTAREA") {
    if (!active && next.value && current.value !== next.value) current.value = next.value;
    return;
  }
  if (current.tagName === "SELECT" && !active && current.value !== next.value) current.value = next.value;
}

function sameNode(current, next) {
  if (current.nodeType !== next.nodeType) return false;
  if (current.nodeType === Node.ELEMENT_NODE) return current.tagName === next.tagName && compatibleKeys(current, next);
  return true;
}

function compatibleKeys(current, next) {
  const currentKey = nodeKey(current);
  const nextKey = nodeKey(next);
  return !currentKey && !nextKey ? true : currentKey === nextKey;
}

function nodeKey(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  return node.getAttribute("data-key") || node.id || "";
}

function findKeyedNode(parent, key, start) {
  for (let node = start; node; node = node.nextSibling) {
    if (nodeKey(node) === key) return node;
  }
  return null;
}
