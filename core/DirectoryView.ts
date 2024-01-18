import fs from "fs"
import path from "path"
import { Complex, stripPath } from "../utils.js";

export class DirectoryView {

    static listFromPath(_path: string): Complex {
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
                path: stripPath(_path),
            };
        } else {
            
            return { type: 'file', path: stripPath(_path), name: path.basename(_path), datetime: stat.mtime, size: stat.size };
        }

    }

}