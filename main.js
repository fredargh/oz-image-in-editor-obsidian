/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/

'use strict';

var obsidian = require('obsidian');

// Remove Widgets in CodeMirror Editor
const clearWidgets = (cm) => {
    var lastLine = cm.lastLine();
    for (let i = 0; i <= lastLine; i++) {
        const line = cm.lineInfo(i);
        clearLineWidgets(line);
    }
};
// Clear Single Line Widget
const clearLineWidgets = (line) => {
    if (line.widgets) {
        for (const wid of line.widgets) {
            if (wid.className === 'oz-image-widget') {
                wid.clear();
            }
        }
    }
};
// Check line if it is a link
const get_link_in_line = (line) => {
    const image_http_regex_3 = /!\[\[[a-z][a-z0-9+\-.]+:\/.*\]\]/;
    const image_http_regex_4 = /!\[[^)]*\]\([a-z][a-z0-9+\-.]+:\/[^)]*\)/;
    const match_3 = line.match(image_http_regex_3);
    const match_4 = line.match(image_http_regex_4);
    if (match_3) {
        return { result: match_3, linkType: 3 };
    }
    else if (match_4) {
        return { result: match_4, linkType: 4 };
    }
    return { result: false, linkType: 0 };
};
// Check line if it is image
const get_image_in_line = (line) => {
    // Regex for [[ ]] format
    const image_line_regex_1 = /!\[\[.*(jpe?g|png|gif|svg|bmp).*\]\]/;
    // Regex for ![ ]( ) format
    const image_line_regex_2 = /!\[(^$|.*)\]\(.*(jpe?g|png|gif|svg|bmp)\)/;
    const match_1 = line.match(image_line_regex_1);
    const match_2 = line.match(image_line_regex_2);
    if (match_1) {
        return { result: match_1, linkType: 1 };
    }
    else if (match_2) {
        return { result: match_2, linkType: 2 };
    }
    return { result: false, linkType: 0 };
};
// Image Name and Alt Text
const getFileNameAndAltText = (linkType, match) => {
    /*
       linkType 1: ![[myimage.jpg|#x-small]], linkType 2: ![#x-small](myimage.jpg)
       linkType 3: ![[https://image|#x-small]], linkType 4: ![#x-small](https://image)
       returns { fileName: '', altText: '' }
    */
    var file_name_regex;
    var alt_regex;
    if (linkType == 1 || linkType == 3) {
        if (linkType == 1)
            file_name_regex = /(?<=\[\[).*(jpe?g|png|gif|svg|bmp)/;
        if (linkType == 3)
            file_name_regex = /(?<=\[\[).*(?=\|)|(?<=\[\[).*(?=\]\])/;
        alt_regex = /(?<=\|).*(?=]])/;
    }
    else if (linkType == 2 || linkType == 4) {
        if (linkType == 2)
            file_name_regex = /(?<=\().*(jpe?g|png|gif|svg|bmp)/;
        if (linkType == 4)
            file_name_regex = /(?<=\().*(?=\))/;
        alt_regex = /(?<=\[)(^$|.*)(?=\])/;
    }
    var file_match = match[0].match(file_name_regex);
    var alt_match = match[0].match(alt_regex);
    return {
        fileName: file_match ? file_match[0] : '',
        altText: alt_match ? alt_match[0] : ''
    };
};
// Getting Active Markdown File
const getActiveNoteFile = (workspace) => {
    return workspace.getActiveFile();
};
// Get Full Path of the image
const getPathOfImage = (vault, image) => {
    return vault.getResourcePath(image) + '?' + image.stat.mtime;
};
const getFileCmBelongsTo = (cm, workspace) => {
    var _a;
    let leafs = workspace.getLeavesOfType("markdown");
    for (let i = 0; i < leafs.length; i++) {
        if (leafs[i].view instanceof obsidian.MarkdownView && ((_a = leafs[i].view.sourceMode) === null || _a === void 0 ? void 0 : _a.cmEditor) == cm) {
            return leafs[i].view.file;
        }
    }
    return null;
};

// Check Single Line
const check_line = (cm, line_number, targetFile, app) => {
    // Get the Line edited
    const line = cm.lineInfo(line_number);
    if (line === null)
        return;
    // Check if the line is an internet link
    const link_in_line = get_link_in_line(line.text);
    const img_in_line = get_image_in_line(line.text);
    // Clear the widget if link was removed
    var line_image_widget = line.widgets ? line.widgets.filter((wid) => wid.className === 'oz-image-widget') : false;
    if (line_image_widget && !(img_in_line.result || link_in_line.result))
        line_image_widget[0].clear();
    // If any of regex matches, it will add image widget
    if (link_in_line.result || img_in_line.result) {
        // Clear the image widgets if exists
        clearLineWidgets(line);
        // Get the file name and alt text depending on format
        var filename = '';
        var alt = '';
        if (link_in_line.result) {
            // linkType 3 and 4
            filename = getFileNameAndAltText(link_in_line.linkType, link_in_line.result).fileName;
            alt = getFileNameAndAltText(link_in_line.linkType, link_in_line.result).altText;
        }
        else if (img_in_line.result) {
            filename = getFileNameAndAltText(img_in_line.linkType, img_in_line.result).fileName;
            alt = getFileNameAndAltText(img_in_line.linkType, img_in_line.result).altText;
        }
        // Create Image
        const img = document.createElement('img');
        // Prepare the src for the Image
        if (link_in_line.result) {
            img.src = filename;
        }
        else {
            // Source Path
            var sourcePath = '';
            if (targetFile != null) {
                sourcePath = targetFile.path;
            }
            else {
                let activeNoteFile = getActiveNoteFile(app.workspace);
                sourcePath = activeNoteFile ? activeNoteFile.path : '';
            }
            var image = app.metadataCache.getFirstLinkpathDest(decodeURIComponent(filename), sourcePath);
            if (image != null)
                img.src = getPathOfImage(app.vault, image);
        }
        // Image Properties
        img.alt = alt;
        // Add Image widget under the Image Markdown
        cm.addLineWidget(line_number, img, { className: 'oz-image-widget' });
    }
};
// Check All Lines Function
const check_lines = (cm, from, to, app) => {
    // Last Used Line Number in Code Mirror
    var file = getFileCmBelongsTo(cm, app.workspace);
    for (let i = from; i <= to; i++) {
        check_line(cm, i, file, app);
    }
};

class OzanImagePlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        // Line Edit Changes
        this.codemirrorLineChanges = (cm, change) => {
            check_lines(cm, change.from.line, change.from.line + change.text.length - 1, this.app);
        };
        // Only Triggered during initial Load
        this.handleInitialLoad = (cm) => {
            var lastLine = cm.lastLine();
            var file = getFileCmBelongsTo(cm, this.app.workspace);
            for (let i = 0; i < lastLine; i++) {
                check_line(cm, i, file, this.app);
            }
        };
    }
    onload() {
        console.log('Image in Editor Plugin is loaded');
        // Register event for each change
        this.registerCodeMirror((cm) => {
            cm.on("change", this.codemirrorLineChanges);
            this.handleInitialLoad(cm);
        });
    }
    onunload() {
        this.app.workspace.iterateCodeMirrors((cm) => {
            cm.off("change", this.codemirrorLineChanges);
            clearWidgets(cm);
        });
        console.log('Image in Editor Plugin is unloaded');
    }
}

module.exports = OzanImagePlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsic3JjL3V0aWxzLnRzIiwic3JjL2NoZWNrLWxpbmUudHMiLCJzcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXb3Jrc3BhY2UsIE1hcmtkb3duVmlldywgVmF1bHQsIFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xuXG4vLyBSZW1vdmUgV2lkZ2V0cyBpbiBDb2RlTWlycm9yIEVkaXRvclxuZXhwb3J0IGNvbnN0IGNsZWFyV2lkZ2V0cyA9IChjbTogQ29kZU1pcnJvci5FZGl0b3IpID0+IHtcbiAgICB2YXIgbGFzdExpbmUgPSBjbS5sYXN0TGluZSgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGxhc3RMaW5lOyBpKyspIHtcbiAgICAgICAgY29uc3QgbGluZSA9IGNtLmxpbmVJbmZvKGkpO1xuICAgICAgICBjbGVhckxpbmVXaWRnZXRzKGxpbmUpO1xuICAgIH1cbn1cblxuLy8gQ2xlYXIgU2luZ2xlIExpbmUgV2lkZ2V0XG5leHBvcnQgY29uc3QgY2xlYXJMaW5lV2lkZ2V0cyA9IChsaW5lOiBhbnkpID0+IHtcbiAgICBpZiAobGluZS53aWRnZXRzKSB7XG4gICAgICAgIGZvciAoY29uc3Qgd2lkIG9mIGxpbmUud2lkZ2V0cykge1xuICAgICAgICAgICAgaWYgKHdpZC5jbGFzc05hbWUgPT09ICdvei1pbWFnZS13aWRnZXQnKSB7XG4gICAgICAgICAgICAgICAgd2lkLmNsZWFyKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gQ2hlY2sgbGluZSBpZiBpdCBpcyBhIGxpbmtcbmV4cG9ydCBjb25zdCBnZXRfbGlua19pbl9saW5lID0gKGxpbmU6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGltYWdlX2h0dHBfcmVnZXhfMyA9IC8hXFxbXFxbW2Etel1bYS16MC05K1xcLS5dKzpcXC8uKlxcXVxcXS9cbiAgICBjb25zdCBpbWFnZV9odHRwX3JlZ2V4XzQgPSAvIVxcW1teKV0qXFxdXFwoW2Etel1bYS16MC05K1xcLS5dKzpcXC9bXildKlxcKS9cbiAgICBjb25zdCBtYXRjaF8zID0gbGluZS5tYXRjaChpbWFnZV9odHRwX3JlZ2V4XzMpO1xuICAgIGNvbnN0IG1hdGNoXzQgPSBsaW5lLm1hdGNoKGltYWdlX2h0dHBfcmVnZXhfNCk7XG4gICAgaWYgKG1hdGNoXzMpIHtcbiAgICAgICAgcmV0dXJuIHsgcmVzdWx0OiBtYXRjaF8zLCBsaW5rVHlwZTogMyB9O1xuICAgIH0gZWxzZSBpZiAobWF0Y2hfNCkge1xuICAgICAgICByZXR1cm4geyByZXN1bHQ6IG1hdGNoXzQsIGxpbmtUeXBlOiA0IH07XG4gICAgfVxuICAgIHJldHVybiB7IHJlc3VsdDogZmFsc2UsIGxpbmtUeXBlOiAwIH07XG59XG5cbi8vIENoZWNrIGxpbmUgaWYgaXQgaXMgaW1hZ2VcbmV4cG9ydCBjb25zdCBnZXRfaW1hZ2VfaW5fbGluZSA9IChsaW5lOiBzdHJpbmcpID0+IHtcbiAgICAvLyBSZWdleCBmb3IgW1sgXV0gZm9ybWF0XG4gICAgY29uc3QgaW1hZ2VfbGluZV9yZWdleF8xID0gLyFcXFtcXFsuKihqcGU/Z3xwbmd8Z2lmfHN2Z3xibXApLipcXF1cXF0vXG4gICAgLy8gUmVnZXggZm9yICFbIF0oICkgZm9ybWF0XG4gICAgY29uc3QgaW1hZ2VfbGluZV9yZWdleF8yID0gLyFcXFsoXiR8LiopXFxdXFwoLiooanBlP2d8cG5nfGdpZnxzdmd8Ym1wKVxcKS9cbiAgICBjb25zdCBtYXRjaF8xID0gbGluZS5tYXRjaChpbWFnZV9saW5lX3JlZ2V4XzEpO1xuICAgIGNvbnN0IG1hdGNoXzIgPSBsaW5lLm1hdGNoKGltYWdlX2xpbmVfcmVnZXhfMik7XG4gICAgaWYgKG1hdGNoXzEpIHtcbiAgICAgICAgcmV0dXJuIHsgcmVzdWx0OiBtYXRjaF8xLCBsaW5rVHlwZTogMSB9XG4gICAgfSBlbHNlIGlmIChtYXRjaF8yKSB7XG4gICAgICAgIHJldHVybiB7IHJlc3VsdDogbWF0Y2hfMiwgbGlua1R5cGU6IDIgfVxuICAgIH1cbiAgICByZXR1cm4geyByZXN1bHQ6IGZhbHNlLCBsaW5rVHlwZTogMCB9XG59XG5cbi8vIEltYWdlIE5hbWUgYW5kIEFsdCBUZXh0XG5leHBvcnQgY29uc3QgZ2V0RmlsZU5hbWVBbmRBbHRUZXh0ID0gKGxpbmtUeXBlOiBudW1iZXIsIG1hdGNoOiBhbnkpID0+IHtcbiAgICAvKiBcbiAgICAgICBsaW5rVHlwZSAxOiAhW1tteWltYWdlLmpwZ3wjeC1zbWFsbF1dLCBsaW5rVHlwZSAyOiAhWyN4LXNtYWxsXShteWltYWdlLmpwZykgXG4gICAgICAgbGlua1R5cGUgMzogIVtbaHR0cHM6Ly9pbWFnZXwjeC1zbWFsbF1dLCBsaW5rVHlwZSA0OiAhWyN4LXNtYWxsXShodHRwczovL2ltYWdlKSBcbiAgICAgICByZXR1cm5zIHsgZmlsZU5hbWU6ICcnLCBhbHRUZXh0OiAnJyB9ICAgXG4gICAgKi9cbiAgICB2YXIgZmlsZV9uYW1lX3JlZ2V4O1xuICAgIHZhciBhbHRfcmVnZXg7XG5cbiAgICBpZiAobGlua1R5cGUgPT0gMSB8fCBsaW5rVHlwZSA9PSAzKSB7XG4gICAgICAgIGlmIChsaW5rVHlwZSA9PSAxKSBmaWxlX25hbWVfcmVnZXggPSAvKD88PVxcW1xcWykuKihqcGU/Z3xwbmd8Z2lmfHN2Z3xibXApLztcbiAgICAgICAgaWYgKGxpbmtUeXBlID09IDMpIGZpbGVfbmFtZV9yZWdleCA9IC8oPzw9XFxbXFxbKS4qKD89XFx8KXwoPzw9XFxbXFxbKS4qKD89XFxdXFxdKS87XG4gICAgICAgIGFsdF9yZWdleCA9IC8oPzw9XFx8KS4qKD89XV0pLztcbiAgICB9IGVsc2UgaWYgKGxpbmtUeXBlID09IDIgfHwgbGlua1R5cGUgPT0gNCkge1xuICAgICAgICBpZiAobGlua1R5cGUgPT0gMikgZmlsZV9uYW1lX3JlZ2V4ID0gLyg/PD1cXCgpLiooanBlP2d8cG5nfGdpZnxzdmd8Ym1wKS87XG4gICAgICAgIGlmIChsaW5rVHlwZSA9PSA0KSBmaWxlX25hbWVfcmVnZXggPSAvKD88PVxcKCkuKig/PVxcKSkvO1xuICAgICAgICBhbHRfcmVnZXggPSAvKD88PVxcWykoXiR8LiopKD89XFxdKS87XG4gICAgfVxuXG4gICAgdmFyIGZpbGVfbWF0Y2ggPSBtYXRjaFswXS5tYXRjaChmaWxlX25hbWVfcmVnZXgpO1xuICAgIHZhciBhbHRfbWF0Y2ggPSBtYXRjaFswXS5tYXRjaChhbHRfcmVnZXgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsZU5hbWU6IGZpbGVfbWF0Y2ggPyBmaWxlX21hdGNoWzBdIDogJycsXG4gICAgICAgIGFsdFRleHQ6IGFsdF9tYXRjaCA/IGFsdF9tYXRjaFswXSA6ICcnXG4gICAgfVxufVxuXG4vLyBHZXR0aW5nIEFjdGl2ZSBNYXJrZG93biBGaWxlXG5leHBvcnQgY29uc3QgZ2V0QWN0aXZlTm90ZUZpbGUgPSAod29ya3NwYWNlOiBXb3Jrc3BhY2UpID0+IHtcbiAgICByZXR1cm4gd29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbn1cblxuLy8gR2V0IEFjdGl2ZSBFZGl0b3JcbmV4cG9ydCBjb25zdCBnZXRDbUVkaXRvciA9ICh3b3Jrc3BhY2U6IFdvcmtzcGFjZSk6IENvZGVNaXJyb3IuRWRpdG9yID0+IHtcbiAgICByZXR1cm4gd29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KT8uc291cmNlTW9kZT8uY21FZGl0b3Jcbn1cblxuLy8gR2V0IEZ1bGwgUGF0aCBvZiB0aGUgaW1hZ2VcbmV4cG9ydCBjb25zdCBnZXRQYXRoT2ZJbWFnZSA9ICh2YXVsdDogVmF1bHQsIGltYWdlOiBURmlsZSkgPT4ge1xuICAgIHJldHVybiB2YXVsdC5nZXRSZXNvdXJjZVBhdGgoaW1hZ2UpICsgJz8nICsgaW1hZ2Uuc3RhdC5tdGltZVxufVxuXG5leHBvcnQgY29uc3QgZ2V0RmlsZUNtQmVsb25nc1RvID0gKGNtOiBDb2RlTWlycm9yLkVkaXRvciwgd29ya3NwYWNlOiBXb3Jrc3BhY2UpID0+IHtcbiAgICBsZXQgbGVhZnMgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFwibWFya2Rvd25cIik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZWFmcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAobGVhZnNbaV0udmlldyBpbnN0YW5jZW9mIE1hcmtkb3duVmlldyAmJiBsZWFmc1tpXS52aWV3LnNvdXJjZU1vZGU/LmNtRWRpdG9yID09IGNtKSB7XG4gICAgICAgICAgICByZXR1cm4gbGVhZnNbaV0udmlldy5maWxlXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59IiwiaW1wb3J0IHsgQXBwLCBURmlsZSB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7XG4gICAgZ2V0RmlsZU5hbWVBbmRBbHRUZXh0LCBnZXRfbGlua19pbl9saW5lLCBnZXRfaW1hZ2VfaW5fbGluZSxcbiAgICBnZXRBY3RpdmVOb3RlRmlsZSwgZ2V0UGF0aE9mSW1hZ2UsIGdldEZpbGVDbUJlbG9uZ3NUbyxcbiAgICBjbGVhckxpbmVXaWRnZXRzXG59IGZyb20gJy4vdXRpbHMnO1xuXG4vLyBDaGVjayBTaW5nbGUgTGluZVxuZXhwb3J0IGNvbnN0IGNoZWNrX2xpbmU6IGFueSA9IChjbTogQ29kZU1pcnJvci5FZGl0b3IsIGxpbmVfbnVtYmVyOiBudW1iZXIsIHRhcmdldEZpbGU6IFRGaWxlLCBhcHA6IEFwcCkgPT4ge1xuXG4gICAgLy8gR2V0IHRoZSBMaW5lIGVkaXRlZFxuICAgIGNvbnN0IGxpbmUgPSBjbS5saW5lSW5mbyhsaW5lX251bWJlcik7XG4gICAgaWYgKGxpbmUgPT09IG51bGwpIHJldHVybjtcblxuICAgIC8vIENoZWNrIGlmIHRoZSBsaW5lIGlzIGFuIGludGVybmV0IGxpbmtcbiAgICBjb25zdCBsaW5rX2luX2xpbmUgPSBnZXRfbGlua19pbl9saW5lKGxpbmUudGV4dCk7XG4gICAgY29uc3QgaW1nX2luX2xpbmUgPSBnZXRfaW1hZ2VfaW5fbGluZShsaW5lLnRleHQpO1xuXG4gICAgLy8gQ2xlYXIgdGhlIHdpZGdldCBpZiBsaW5rIHdhcyByZW1vdmVkXG4gICAgdmFyIGxpbmVfaW1hZ2Vfd2lkZ2V0ID0gbGluZS53aWRnZXRzID8gbGluZS53aWRnZXRzLmZpbHRlcigod2lkOiB7IGNsYXNzTmFtZTogc3RyaW5nOyB9KSA9PiB3aWQuY2xhc3NOYW1lID09PSAnb3otaW1hZ2Utd2lkZ2V0JykgOiBmYWxzZTtcbiAgICBpZiAobGluZV9pbWFnZV93aWRnZXQgJiYgIShpbWdfaW5fbGluZS5yZXN1bHQgfHwgbGlua19pbl9saW5lLnJlc3VsdCkpIGxpbmVfaW1hZ2Vfd2lkZ2V0WzBdLmNsZWFyKCk7XG5cbiAgICAvLyBJZiBhbnkgb2YgcmVnZXggbWF0Y2hlcywgaXQgd2lsbCBhZGQgaW1hZ2Ugd2lkZ2V0XG4gICAgaWYgKGxpbmtfaW5fbGluZS5yZXN1bHQgfHwgaW1nX2luX2xpbmUucmVzdWx0KSB7XG5cbiAgICAgICAgLy8gQ2xlYXIgdGhlIGltYWdlIHdpZGdldHMgaWYgZXhpc3RzXG4gICAgICAgIGNsZWFyTGluZVdpZGdldHMobGluZSk7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBmaWxlIG5hbWUgYW5kIGFsdCB0ZXh0IGRlcGVuZGluZyBvbiBmb3JtYXRcbiAgICAgICAgdmFyIGZpbGVuYW1lID0gJyc7XG4gICAgICAgIHZhciBhbHQgPSAnJztcblxuICAgICAgICBpZiAobGlua19pbl9saW5lLnJlc3VsdCkge1xuICAgICAgICAgICAgLy8gbGlua1R5cGUgMyBhbmQgNFxuICAgICAgICAgICAgZmlsZW5hbWUgPSBnZXRGaWxlTmFtZUFuZEFsdFRleHQobGlua19pbl9saW5lLmxpbmtUeXBlLCBsaW5rX2luX2xpbmUucmVzdWx0KS5maWxlTmFtZVxuICAgICAgICAgICAgYWx0ID0gZ2V0RmlsZU5hbWVBbmRBbHRUZXh0KGxpbmtfaW5fbGluZS5saW5rVHlwZSwgbGlua19pbl9saW5lLnJlc3VsdCkuYWx0VGV4dFxuICAgICAgICB9IGVsc2UgaWYgKGltZ19pbl9saW5lLnJlc3VsdCkge1xuICAgICAgICAgICAgZmlsZW5hbWUgPSBnZXRGaWxlTmFtZUFuZEFsdFRleHQoaW1nX2luX2xpbmUubGlua1R5cGUsIGltZ19pbl9saW5lLnJlc3VsdCkuZmlsZU5hbWU7XG4gICAgICAgICAgICBhbHQgPSBnZXRGaWxlTmFtZUFuZEFsdFRleHQoaW1nX2luX2xpbmUubGlua1R5cGUsIGltZ19pbl9saW5lLnJlc3VsdCkuYWx0VGV4dFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIEltYWdlXG4gICAgICAgIGNvbnN0IGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuXG4gICAgICAgIC8vIFByZXBhcmUgdGhlIHNyYyBmb3IgdGhlIEltYWdlXG4gICAgICAgIGlmIChsaW5rX2luX2xpbmUucmVzdWx0KSB7XG4gICAgICAgICAgICBpbWcuc3JjID0gZmlsZW5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTb3VyY2UgUGF0aFxuICAgICAgICAgICAgdmFyIHNvdXJjZVBhdGggPSAnJztcbiAgICAgICAgICAgIGlmICh0YXJnZXRGaWxlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzb3VyY2VQYXRoID0gdGFyZ2V0RmlsZS5wYXRoO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgYWN0aXZlTm90ZUZpbGUgPSBnZXRBY3RpdmVOb3RlRmlsZShhcHAud29ya3NwYWNlKTtcbiAgICAgICAgICAgICAgICBzb3VyY2VQYXRoID0gYWN0aXZlTm90ZUZpbGUgPyBhY3RpdmVOb3RlRmlsZS5wYXRoIDogJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaW1hZ2UgPSBhcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChkZWNvZGVVUklDb21wb25lbnQoZmlsZW5hbWUpLCBzb3VyY2VQYXRoKTtcbiAgICAgICAgICAgIGlmIChpbWFnZSAhPSBudWxsKSBpbWcuc3JjID0gZ2V0UGF0aE9mSW1hZ2UoYXBwLnZhdWx0LCBpbWFnZSlcbiAgICAgICAgfVxuICAgICAgICAvLyBJbWFnZSBQcm9wZXJ0aWVzXG4gICAgICAgIGltZy5hbHQgPSBhbHQ7XG5cbiAgICAgICAgLy8gQWRkIEltYWdlIHdpZGdldCB1bmRlciB0aGUgSW1hZ2UgTWFya2Rvd25cbiAgICAgICAgY20uYWRkTGluZVdpZGdldChsaW5lX251bWJlciwgaW1nLCB7IGNsYXNzTmFtZTogJ296LWltYWdlLXdpZGdldCcgfSk7XG4gICAgfVxufVxuXG4vLyBDaGVjayBBbGwgTGluZXMgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBjaGVja19saW5lczogYW55ID0gKGNtOiBDb2RlTWlycm9yLkVkaXRvciwgZnJvbTogbnVtYmVyLCB0bzogbnVtYmVyLCBhcHA6IEFwcCkgPT4ge1xuICAgIC8vIExhc3QgVXNlZCBMaW5lIE51bWJlciBpbiBDb2RlIE1pcnJvclxuICAgIHZhciBmaWxlID0gZ2V0RmlsZUNtQmVsb25nc1RvKGNtLCBhcHAud29ya3NwYWNlKTtcbiAgICBmb3IgKGxldCBpID0gZnJvbTsgaSA8PSB0bzsgaSsrKSB7XG4gICAgICAgIGNoZWNrX2xpbmUoY20sIGksIGZpbGUsIGFwcCk7XG4gICAgfVxufSIsImltcG9ydCB7IFBsdWdpbiB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IGNsZWFyV2lkZ2V0cywgZ2V0RmlsZUNtQmVsb25nc1RvIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBjaGVja19saW5lLCBjaGVja19saW5lcyB9IGZyb20gJy4vY2hlY2stbGluZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE96YW5JbWFnZVBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG5cbiAgICBvbmxvYWQoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdJbWFnZSBpbiBFZGl0b3IgUGx1Z2luIGlzIGxvYWRlZCcpO1xuICAgICAgICAvLyBSZWdpc3RlciBldmVudCBmb3IgZWFjaCBjaGFuZ2VcbiAgICAgICAgdGhpcy5yZWdpc3RlckNvZGVNaXJyb3IoKGNtOiBDb2RlTWlycm9yLkVkaXRvcikgPT4ge1xuICAgICAgICAgICAgY20ub24oXCJjaGFuZ2VcIiwgdGhpcy5jb2RlbWlycm9yTGluZUNoYW5nZXMpO1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVJbml0aWFsTG9hZChjbSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgb251bmxvYWQoKSB7XG4gICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5pdGVyYXRlQ29kZU1pcnJvcnMoKGNtKSA9PiB7XG4gICAgICAgICAgICBjbS5vZmYoXCJjaGFuZ2VcIiwgdGhpcy5jb2RlbWlycm9yTGluZUNoYW5nZXMpO1xuICAgICAgICAgICAgY2xlYXJXaWRnZXRzKGNtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdJbWFnZSBpbiBFZGl0b3IgUGx1Z2luIGlzIHVubG9hZGVkJyk7XG4gICAgfVxuXG4gICAgLy8gTGluZSBFZGl0IENoYW5nZXNcbiAgICBjb2RlbWlycm9yTGluZUNoYW5nZXMgPSAoY206IGFueSwgY2hhbmdlOiBhbnkpID0+IHtcbiAgICAgICAgY2hlY2tfbGluZXMoY20sIGNoYW5nZS5mcm9tLmxpbmUsIGNoYW5nZS5mcm9tLmxpbmUgKyBjaGFuZ2UudGV4dC5sZW5ndGggLSAxLCB0aGlzLmFwcCk7XG4gICAgfVxuXG4gICAgLy8gT25seSBUcmlnZ2VyZWQgZHVyaW5nIGluaXRpYWwgTG9hZFxuICAgIGhhbmRsZUluaXRpYWxMb2FkID0gKGNtOiBDb2RlTWlycm9yLkVkaXRvcikgPT4ge1xuICAgICAgICB2YXIgbGFzdExpbmUgPSBjbS5sYXN0TGluZSgpO1xuICAgICAgICB2YXIgZmlsZSA9IGdldEZpbGVDbUJlbG9uZ3NUbyhjbSwgdGhpcy5hcHAud29ya3NwYWNlKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXN0TGluZTsgaSsrKSB7XG4gICAgICAgICAgICBjaGVja19saW5lKGNtLCBpLCBmaWxlLCB0aGlzLmFwcCk7XG4gICAgICAgIH1cbiAgICB9XG5c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
