import fs from "fs"
import path from "path"

export class DirectoryView {

    static listFromPath(_path) {
        const stat = fs.statSync(_path);

        if (stat.isDirectory()) {
            const files = fs.readdirSync(_path);

            const tree = files.map((file) => {
                const newPath = path.join(_path, file);
                return DirectoryView.listFromPath(newPath);
            });

            return { 
                type: 'folder',
                content: tree,
                name: path.basename(_path),
                path: DirectoryView.stripPath(_path),
            };
        } else {
            
            return { type: 'file', path: DirectoryView.stripPath(_path), name: path.basename(_path), datetime: stat.mtime, size: stat.size };
        }

    }

    static stripPath(_path = "") {
        return _path.slice(_path.indexOf("wwwroot")).replace("\\", "/");
    }


}