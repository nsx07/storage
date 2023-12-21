import fs from "fs"
import path from "path"

export class Node {

    name;
    children;

    constructor(name, children) {
        this.name = name;
        this.children = children;
    }

    append(name, children) {
        if (!this.children) {
            this.children = [];
        }
        this.children.push(new Node(name, children));
    }

}

export class DirectoryView {

    static listFromPath(_path) {
        const stat = fs.statSync(_path);

        if (stat.isDirectory()) {
            const files = fs.readdirSync(_path);

            const tree = files.map((file) => {
                const newPath = path.join(_path, file);
                return DirectoryView.listFromPath(newPath);
            });

            return { type: 'folder', name: path.basename(_path), content: tree };
        } else {
            return { type: 'file', name: path.basename(_path) };
        }

    }


}