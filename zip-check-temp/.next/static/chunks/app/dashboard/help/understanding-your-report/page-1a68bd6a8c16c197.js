 OSType.WINDOWS) {
                // 处理windows 盘符特殊字符转换  
                fullPath = util_1.Util.replace(that.fullPath);
                // }
                const targetPath = fullPath + "/" + input;
                const targetPath1 = that.fullPath + "/" + input;
                const tempPath = yield fileManager_1.FileManager.record(`temp/${keyDir}` + targetPath, "", fileManager_1.FileModel.WRITE);
                const rt = yield ftpconn_1.FTPConn.put(ftpInfo, tempPath, targetPath1);
                if (rt) {
                    api_1.API.refresh();
                    console_1.Console.info((0, localize_1.default)("xplot.msg.api.file.new.yes", input));
                }
            }
            else {
                console_1.Console.info((0, localize_1.default)("xplot.msg.api.file.new.no"));
            }
        }));
    }
    //删除文件
    static file_delete(that) {
        let filename = that.file.name;
        vscode.window.showQuickPick([(0, localize_1.default)("xplot.yes"), (0, localize_1.default)("xplot.no")], { placeHolder: (0, localize_1.default)("xplot.msg.api.file.delete.title", filename), canPickMany: false }).then((str) => __awaiter(this, void 0, void 0, function* () {
            if (str == (0, localize_1.default)("xplot.yes")) {
                if (that.contextValue == constant_1.NodeType.FTP_FOLDER) {
                    const rt = yield ftpconn_1.FTPConn.rmdir(that.info.ftp, that.fullPath);
                    if (rt) {
                        api_1.API.refresh();
                        console_1.Console.info((0, localize_1.default)("xplot.msg.api.file.delete.yes", that.fullPath));
                    }
                }
                else if (that.contextValue == constant_1.NodeType.FTP_FILE) {
                    const rt = yield ftpconn_1.FTPConn.delete(that.info.ftp, that.fullPath);
                    if (rt) {
                        api_1.API.refresh();
                        console_1.Console.info((0, localize_1.default)("xplot.msg.api.file.delete.yes", that.fullPath));
                    }
                }
                else {
                    console_1.Console.warn((0, localize_1.default)("xplot.msg.api.file.delete.err", that.contextValue));
                }
            }
        }));
    }
    //打开文件
    static file_open(that) {
        return __awaiter(this, void 0, void 0, function* () {
            var progressStream = __webpack_require__(40);
            const infovo = that.info;
            const ftpInfo = infovo.ftp;
            const extName = path.extname(that.file.name).toLowerCase();
            for (const ext of settings_1.Settings.ProhibitFileExt) {
                if (extName == ext) {
                    console_1.Console.warn((0, localize_1.default)("xplot.msg.api.file.open.err.fileext", extName));
                    return;
                }
            }
            if (that.file.size > settings_1.Settings.OpenFileMaxSize * 1048576) {
                console_1.Console.warn((0, localize_1.default)("xplot.msg.api.file.open.err.filemaxsize", that.file.name, settings_1.Settings.OpenFileMaxSize + "MB"));
                return;
            }
            const keyDir = `${ftpInfo.ftp.user}@${ftpInfo.ftp.host}#${ftpInfo.ftp.port}`;
            const { client } = yield ftpconn_1.FTPConn.get(ftpInfo);
            let fullPath = that.fullPath;
            // if (config.info.ostype == OSType.WINDOWS) {
            // 处理windows 盘符特殊字符转换  
            fullPath = util_1.Util.replace(that.fullPath);
            // }
            const tempPath = yield fileManager_1.FileManager.record(`temp/${keyDir}${fullPath}`, null, fileManager_1.FileModel.WRITE);
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: (0, localize_1.default)("xplot.msg.api.file.open.title", that.fullPath),
                cancellable: true
            }, (progress, token) => {
                return new Promise((resolve) => {
                    let mark = setTimeout(() => {
                        resolve(false);
                        mark = null;
                    }, 6000);
                    const begin_time = new Date().getTime();
                    let before = 0;
                    let option = {
                        step: function (total_transferred, chunk, total) {
                            const percentage = Math.floor(total_transferred / total * 100);
                            progress.report({ increment: percentage - before, message: (0, localize_1.default)("xplot.msg.api.file.open.remaining", prettyBytes(total - total_transferred)) });
                            before = percentage;
                        }
                    };
                    client.get(that.fullPath, (err, fileReadStream) => __awaiter(this, void 0, void 0, function* () {
                        if (mark) {
                            clearTimeout(mark);
                            const end_time = new Date().getTime();
                            const time = ((end_time - begin_time) / 1000).toFixed(2);
                            if (err) {
                                console_1.Console.err(err);
                            }
                            else {
                                var str = progressStream({
                                    length: that.file.size,
                                    time: 100
                                });
                                const outStream = (0, fs_1.createWriteStream)(tempPath);
                                fileReadStream.pipe(str).pipe(outStream);
                                token.onCancellationRequested(() => {
                                    fileReadStream.destroy();
                                    outStream.destroy();
                                });
                                console_1.Console.info((0, localize_1.default)("xplot.msg.api.file.open.ok", that.fullPath, time));
                                const tempFileRemotes = storage_1.Storage.get_temp_file_remotes();
                                const timestamp = new Date().getTime();
                                // NodeProvider.tempRemoteMap.set(path.resolve(tempPath), { remote: that.fullPath, config: that.config })
                                const hash_v = util_1.Util.fileHash(path.resolve(tempPath));
                                tempFileRemotes[path.resolve(tempPath)] = { remote: that.fullPath, ftp: ftpInfo, hash: hash_v, timeStamp: timestamp };
                                storage_1.Storage.update_temp_file_remotes(tempFileRemotes);
                                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(tempPath));
                                resolve(null);
                                return;
                            }
                        }
                    }));
                });
            });
        });
    }
    // 统计过滤目录文件
    static file_verify(ftpInfo, path, currpath = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const fpath = currpath ? `${path}/${currpath}` : path;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const entryList = yield ftpconn_1.FTPConn.list(ftpInfo, fpath);
                if (entryList) {
                    let entrys = [];
                    for (const entry of entryList) {
                        if (entry.type.startsWith("-")) {
                            entry['path'] = path;
                            entry['currpath'] = currpath;
                            entrys.push(entry);
                        }
                        else if (entry.type.startsWith("d")) {
                            const cpath = currpath ? `${currpath}/${entry.name}` : entry.name;
                            const drr = yield FTPAPI.file_verify(ftpInfo, path, cpath);
                            entrys = entrys.concat(drr);
                        }
                        else {
                            let flag;
                            if (entry.type == "l") {
                                flag = constant_1.NodeType.FTP_LINK;
                            }
                            else if (entry.type == "b") {
                                flag = constant_1.NodeType.FTP_BLOCK;
                            }
                            else if (entry.type == "c") {
                                flag = constant_1.NodeType.FTP_CHARACTER;
                            }
                            else if (entry.type == "p") {
                                flag = constant_1.NodeType.FTP_PIPE;
                            }
                            else if (entry.type == "s") {
                                flag = constant_1.NodeType.FTP_SOCKETS;
                            }
                            else {
                                flag = "Unknown";
                            }
                            const cpath = currpath ? `${currpath}/${entry.name}` : entry.name;
                            console_1.Console.info((0, localize_1.default)("xplot.msg.api.file.download.filter", flag, cpath));
                        }
                    }
                    resolve(entrys);
                }
            }));
        });
    }
    //下载文件
    static file_download(that) {
        var _a;
        if (that.contextValue == constant_1.NodeType.FTP_FOLDER || that.contextValue == constant_1.NodeType.FTP_WORKSPACE) {
            vscode.window.showOpenDialog({ canSelectFiles: false, canSelectMany: false, canSelectFolders: true, openLabel: (0, localize_1.default)("xplot.msg.conn.downloadfile") })
                .then((uri) => __awaiter(this, void 0, void 0, function* () {
                if (uri) {
                    const { client } = yield ftpconn_1.FTPConn.get(that.info.ftp);
                    var progressStream = __webpack_require__(40);
                    let filename = that.contextValue == constant_1.NodeType.FTP_WORKSPACE ? that.workSpace.name : that.file.name;
                    let dpath;
                    filename = util_1.Util.replace(filename);
                    if (os.type() == constant_1.OSTypes.WINDOWS) {
                        dpath = uri[0].path.substr(1) + "/" + filename;
                    }
                    else {
                        dpath = uri[0].path + "/" + filename;
                    }
                    //若是目录存在，创建新目录
                    if (!fs.existsSync(dpath)) {
                        fs.mkdirpSync(dpath);
                    }
                    else {
                        const str = Math.random().toString(36).substr(2).slice(2, 5);
                        dpath += "_" + str;
                        fs.mkdirpSync(dpath);
                    }
                    const entrys = yield FTPAPI.file_verify(that.info.ftp, that.fullPath);
                    // console.log("提示", entrys)
                    const entry_list_size = entrys.length;
                    if (entry_list_size == 0) {
                        console_1.Console.info((0, localize_1.default)("xplot.msg.api.file.download.null"));
                    }
                    let curr_entry_index = 0;
                    for (const entry of entrys) {
                        curr_entry_index += 1;
                        entry.currpath = entry.currpath ? util_1.Util.replace(entry.currpath) : entry.currpath;
                        let rfile = entry.currpath ? that.fullPath + "/" + entry.currpath + "/" + entry.name : that.fullPath + "/" + entry.name;
                        let lfile = entry.currpath ? dpath + "/" + entry.currpath + "/" + entry.name : dpath + "/" + entry.name;
                        let ldir = entry.currpath ? dpath + "/" + entry.currpath : dpath;
                        let currfile = entry.currpath ? entry.currpath + "/" + entry.name : entry.name;
                        if (!fs.existsSync(ldir)) {
                            fs.mkdirpSync(ldir);
                        }
                        yield vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: (0, localize_1.default)("xplot.msg.api.file.download.title", `[${curr_entry_index}/${entry_list_size}] ${that.fullPath} for ${currfile}`),
                            cancellable: true
                        }, (progress, token) => {
                            return new Promise((resolve) => {
                                let mark = setTimeout(() => {
                                    resolve(false);
                                    mark = null;
                                }, 6000);
                                client.get(rfile, (err, fileReadStream) => __awaiter(this, void 0, void 0, function* () {
                                    if (mark) {
                                        clearTimeout(mark);
                                        var str = progressStream({
                                            length: entry.size,
                                            time: 100
                                        });
                                        let before = 0;
                                        str.on("progress", (progressData) => {
                                            if (progressData.percentage == 100) {
                                                resolve(null);
                                                console_1.Console.info((0, localize_1.default)("xplot.msg.api.file.download.ok", `[${curr_entry_index}/${entry_list_size}] ${that.fullPath} for ${currfile} to ${ldir}`, progressData.runtime + 1));
                                                return;
                                            }
                                            progress.report({ increment: progressData.percentage - before, message: (0, localize_1.default)("xplot.msg.api.file.download.remaining", prettyBytes(progressData.remaining)) });
                                            before = progressData.percentage;
                                        });
                                        str.on("error", err => {
                                            console_1.Console.err(err);
                                        });
                                        const outStream = (0, fs_1.createWriteStream)(lfile);
                                        fileReadStream.pipe(str).pipe(outStream);
                                        token.onCancellationRequested(() => {
                                            fileReadStream.destroy();
                                            outStream.destroy();
                                        });
                                    }
                                }));
                                // FTPAPI.refresh();
                            });
                        });
                    }
                }
            }));
        }
        else {
            const extName = (_a = (0, path_1.extname)(that.file.name)) === null || _a === void 0 ? void 0 : _a.replace(".", "");
            vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file(that.file.name), filters: { "Type": [extName] }, saveLabel: (0, localize_1.default)("xplot.msg.conn.downloadfile") })
                .then((uri) => __awaiter(this, void 0, void 0, function* () {
                if (uri) {
                    const { client } = yield ftpconn_1.FTPConn.get(that.info.ftp);
                    var progressStream = __webpack_require__(40);
                    vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: (0, localize_1.default)("xplot.msg.api.file.download.title", that.fullPath),
                        cancellable: true
                    }, (progress, token) => {
                        return new Promise((resolve) => {
                            let mark = setTimeout(() => {
                                resolve(false);
                                mark = null;
                            }, 6000);
                            // const fileReadStream = client.get(that.fullPath)
                            client.get(that.fullPath, (err, fileReadStream) => __awaiter(this, void 0, void 0, function* () {
                                if (mark) {
                                    clearTimeout(mark);
                                    var str = progressStream({
                                        length: that.file.size,
                                        time: 100
                                    });
                                    let before = 0;
                                    str.on("progress", (progressData) => {
                                        if (progressData.percentage == 100) {
                                            resolve(null);
                                            console_1.Console.info((0, localize_1.default)("xplot.msg.api.file.download.ok", that.fullPath, progressData.runtime + 1));
                                            return;
                                        }
                                        progress.report({ increment: progressData.percentage - before, message: (0, localize_1.default)("xplot.msg.api.file.download.remaining", prettyBytes(progressData.remaining)) });
                                        before = progressData.percentage;
                                    });
                                    str.on("error", err => {
                                        console_1.Console.err(err);
                                    });
                                    const outStream = (0, fs_1.createWriteStream)(uri.fsPath);
                                    fileReadStream.pipe(str).pipe(outStream);
                                    token.onCancellationRequested(() => {
                                        fileReadStream.destroy();
                                        outStream.destroy();
                                    });
                                }
                            }));
                            // FTPAPI.refresh();
                        });
                    });
                }
            }));
        }
    }
    // 新建目录
    static new_folder(that) {
        vscode.window.showInputBox({ placeHolder: (0, localize_1.default)("xplot.msg.api.folder.new.title"), ignoreFocusOut: true }).then((input) => __awaiter(this, void 0, void 0, function* () {
            input = input.trim();
            if (input) {
                const ftpInfo = that.info.ftp;
                if (ftpInfo.id === that.id) {
                    that.fullPath = "";
                }
                const rt = yield ftpconn_1.FTPConn.mkdir(ftpInfo, that.fullPath + "/" + input);
                if (rt) {
                    api_1.API.refresh();
                    console_1.Console.info((0, localize_1.default)("xplot.msg.api.folder.new.yes", input));
                }
            }
            else {
                console_1.Console.info((0, localize_1.default)("xplot.msg.api.folder.new.no"));
            }
        }));
    }
    // 上传文件
    static file_upload(that) {
        vscode.window.showOpenDialog({ canSelectFiles: true, canSelectMany: true, canSelectFolders: false, openLabel: (0, localize_1.default)("xplot.msg.conn.uploadfile") })
            .then((uri) => __awaiter(this, void 0, void 0, function* () {
            if (uri) {
                const url_size = uri.length;
                let curr_url_index = 0;
                for (let key in uri) {
                    curr_url_index += 1;
                    const targetPath = uri[key].fsPath;
                    yield vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: (0, localize_1.default)("xplot.msg.api.file.upload.title", `[${curr_url_index}/${url_size}] ${targetPath}`),
                        cancellable: true
                    }, (progress, token) => {
                        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                            const begin_time = new Date().getTime();
                            const rt = yield ftpconn_1.FTPConn.put(that.info.ftp, targetPath, that.fullPath + "/" + path.basename(targetPath));
                            const end_time = new Date().getTime();
                            const time = ((end_time - begin_time) / 1000).toFixed(2);
                            if (rt) {
                                console_1.Console.info((0, localize_1.default)("xplot.msg.api.file.upload.ok", `[${curr_url_index}/${url_size}] ${targetPath}`, time));
                                resolve(null);
                            }
                            api_1.API.refresh();
                        })