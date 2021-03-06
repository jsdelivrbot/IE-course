// Test Funcs
// See Inspect Element's Console Log Output
(function () {
    "use strict";

    let DEBUG = true;
    let log = DEBUG ? console.log.bind(console) : function () {
    };

    let game_id;
    let game_title;
    let game_current_level;
    let game_levels;

    let cell_neighbor_mines = [];
    let flagged_cell = 0;
    let timer;

    function renderElements() {
        function renderModal() {
            let modal = document.createElement("div");
            modal.className = "modal";

            let modalContent = document.createElement("div");
            modalContent.className = "modal-content";
            modal.appendChild(modalContent);

            let inputField = document.createElement("input");
            inputField.className = "field";
            inputField.id = "name";
            inputField.placeHolder = "Enter your name";

            let okButton = document.createElement("button");
            okButton.innerHTML = "OK";

            modalContent.appendChild(inputField);
            modalContent.appendChild(okButton);

            return modal;
        }

        function renderGameWindow() {
            let gameWindow = document.createElement("div");
            gameWindow.className = "window";

            let titleBar = (function () {
                let titleBar = document.createElement("div");
                titleBar.className = "title-bar";

                let gameTitle = document.createElement("span");
                gameTitle.id = "game-title";
                gameTitle.innerHTML = "Minesweeper Online - Beginner!";

                let btnContainer = document.createElement("div");

                let btns = [];
                for (let i = 0; i < 2; i++) {
                    btns[i] = document.createElement("span");
                    btns[i].className = "btn";
                    btnContainer.appendChild(btns[i])
                }
                btns[0].id = "btn-minimize";
                btns[1].id = "btn-close";

                titleBar.appendChild(gameTitle);
                titleBar.appendChild(btnContainer);

                return titleBar;
            }());

            let topPart = (function () {
                let topPart = document.createElement("div");
                topPart.className = "top";

                let counter1 = document.createElement("span");
                counter1.className = "counter";
                counter1.innerHTML = 123;

                let smile = document.createElement("span");
                smile.className = "smile";
                smile.setAttribute("data-value", "normal");

                let counter2 = document.createElement("span");
                counter2.className = "counter";
                counter2.innerHTML = 321;

                topPart.appendChild(counter1);
                topPart.appendChild(smile);
                topPart.appendChild(counter2);

                return topPart;
            }());

            let grid = (function () {
                let grid = document.createElement("div");
                grid.className = "grid";
                return grid;
            }());

            gameWindow.appendChild(titleBar);
            gameWindow.appendChild(topPart);
            gameWindow.appendChild(grid);

            return gameWindow;
        }

        let body = document.getElementsByTagName("body")[0];

        let modal = renderModal();
        let gameWindow = renderGameWindow();

        body.appendChild(modal);
        body.appendChild(gameWindow);
    }

    function parseXmlString(xml_str) {
        function parse() {
            try {
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(xml_str, "text/xml");
                let game = xmlDoc.getElementsByTagName("game")[0];
                let id = game.getAttribute('id');
                let title = game.getAttribute('title');
                let levels_list = [];
                let levels = game.getElementsByTagName("levels")[0];
                let default_level = levels.getAttribute("default");
                let level_list = levels.getElementsByTagName("level");
                for (let l = 0; l < level_list.length; l++) {
                    let level = level_list[l];
                    let level_id = level.getAttribute("id");
                    let level_title = level.getAttribute("title");
                    let timer = level.getAttribute("timer");
                    let rows = level.getElementsByTagName("rows")[0];
                    let cols = level.getElementsByTagName("cols")[0];
                    let mines = level.getElementsByTagName("mines")[0];
                    let time = level.getElementsByTagName("time")[0];

                    let game_level = {
                        "id": level_id,
                        "title": level_title,
                        "timer": timer,
                        "rows": rows.childNodes[0].nodeValue,
                        "cols": cols.childNodes[0].nodeValue,
                        "mines": mines.childNodes[0].nodeValue,
                        "time": time.childNodes[0].nodeValue
                    };
                    levels_list.push(game_level);
                }

                return {
                    "id": id,
                    "title": title,
                    "default_level": default_level,
                    "levels": levels_list
                }
            } catch (err) {
                log("error parsing xml_str");
                alert("error parsing xml_str");
            }
        }

        let dict = parse();
        let id = dict['id'],
            title = dict['title'],
            default_level = dict['default_level'],
            levels = dict['levels'];

        log('** processed xml results **');
        log('game id: ' + id);
        log('game title: ' + title);
        log('default level: ' + default_level);
        log('game levels:');
        log(levels);
        log('--------------------');

        // assign necessary vars to global vars
        game_id = id;
        game_title = title;
        game_current_level = default_level;
        game_levels = levels;
    }

    function newGame(level_type) {
        function generateLevelInfo(level_type) {
            function findAppropriateLevel(level_type) {
                for (let i = 0; i < game_levels.length; i++) {
                    if (game_levels[i]["title"] == level_type)
                        return game_levels[i]["id"]
                }
            }

            if (!game_current_level)
                game_current_level = 1;
            if (level_type)
                game_current_level = findAppropriateLevel(level_type);

            let rows = game_levels[game_current_level - 1]["rows"];
            let cols = game_levels[game_current_level - 1]["cols"];
            let mines = game_levels[game_current_level - 1]["mines"];
            var requestXML = `
                <request>
                <rows>${rows}</rows>
                <cols>${cols}</cols>
                <mines>${mines}</mines>
                </request>
                `;

            log('** xml level information - request xml **');
            log(requestXML);
            log('--------------------');

            return requestXML;
        }

        function convertXml2Html(xml_str) {
            let xsltProcessor = new XSLTProcessor();
            let domParser = new DOMParser();
            let xmlStrDoc = domParser.parseFromString(xml_str, "text/xml").childNodes[0];
            let templateDoc = domParser.parseFromString(makeXSL(), "text/xml").childNodes[0];
            xsltProcessor.importStylesheet(templateDoc);
            let resultDocument = xsltProcessor.transformToFragment(xmlStrDoc, document);
            document.getElementsByClassName('grid')[0].appendChild(resultDocument);
        }

        function makeXSL() {
            return `
            <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
                <xsl:template match="grid">
                    <xsl:for-each select="./row">
                        <xsl:for-each select="./col">
                            <span>
                                <xsl:attribute name="id">
                                    <xsl:text>c</xsl:text>
                                    <xsl:value-of select="../@row"/>
                                    <xsl:value-of select="./@col"/>
                                </xsl:attribute>
                                <xsl:if test="./@mine">
                                    <xsl:attribute name="data-value">
                                        <xsl:text>mine</xsl:text>
                                    </xsl:attribute>
                                </xsl:if>
                            </span>
                        </xsl:for-each>
                    </xsl:for-each>
                </xsl:template>
            </xsl:stylesheet>`;
        }

        var requestXML = generateLevelInfo(level_type);
        getNewGame(requestXML, convertXml2Html);
        addGridCellsEvents();
        revealNeighborsAfterFlagging();
        setTimer();
        updateTimer();
        setGameOver();
        setCounter();
        calculateNeighborMines();
    }

    function getCells() {
        let grid_el = document.getElementsByClassName("grid")[0];
        return grid_el.getElementsByTagName("span");
    }

    function attachGridCellsEvents(events) {
        let cells = getCells();
        for (let c = 0; c < cells.length; c++) {
            events(cells[c]);
        }
    }

    function addGridCellsEvents() {
        attachGridCellsEvents(function (cell) {
            cell.addEventListener("mousedown", doMouseDownActions);
            cell.addEventListener("mouseup", doMouseLeftActions);
            cell.addEventListener("mouseup", doMouseRightActions);
        });
    }

    function removeGridCellsEvent() {
        attachGridCellsEvents(function (cell) {
            cell.removeEventListener("mousedown", doMouseDownActions);
            cell.removeEventListener("mouseup", doMouseLeftActions);
            cell.removeEventListener("mouseup", doMouseRightActions)
        })
    }

    function revealNeighbors(row, col) {
        try {
            let rows = game_levels[game_current_level - 1]["rows"];
            let cols = game_levels[game_current_level - 1]["cols"];
            if (row < 1 || col < 1 || row > rows || col > cols)
                return;
            let cell = document.getElementById(`c${row}${col}`);
            if (cell.getAttribute("data-value") != "mine") {
                if (cell.getAttribute("class") == "revealed") {
                    return;
                }

                if (cell.getAttribute("class") != "flag") {
                    cell.className = "revealed";
                }

                if (cell_neighbor_mines[`c${row}${col}`] != 0) {
                    cell.setAttribute("data-value", cell_neighbor_mines[`c${row}${col}`]);
                    return;
                }

                revealNeighbors(row - 1, col - 1);
                revealNeighbors(row - 1, col);
                revealNeighbors(row - 1, col + 1);
                revealNeighbors(row, col + 1);
                revealNeighbors(row + 1, col + 1);
                revealNeighbors(row + 1, col);
                revealNeighbors(row + 1, col - 1);
                revealNeighbors(row, col - 1);
            }
        } catch (err) {
            // pass
        }
    }

    function doMouseDownActions(event) {
        if (event.button == 0)
            this.className = "active";
    }

    function doMouseLeftActions(event) {
        if (event.button == 0) {
            let row = parseInt(this.id.charAt(1)), col = parseInt(this.id.charAt(2));
            revealNeighbors(row, col);
        }
    }

    function doMouseRightActions(event) {
        function mouseRightSetEvent(cell) {
            if (flagged_cell < game_levels[game_current_level - 1]["mines"]) {
                cell.className = "flag";
                flagged_cell++;
                setCounter();
            }
        }

        function mouseSetQuestionMark(cell) {
            cell.className = "question";
        }

        function mouseRightUnsetEvent(cell) {
            cell.removeAttribute("class");
            flagged_cell--;
            setCounter();
        }

        if (event.button == 2) {
            if (this.getAttribute("class")) {
                if (this.getAttribute("class") == "question") {
                    mouseRightUnsetEvent(this);
                } else if (this.getAttribute("class") == "flag") {
                    mouseSetQuestionMark(this);
                }
            } else {
                mouseRightSetEvent(this);
            }
        }
    }

    function revealNeighborsAfterFlagging() {
        function getNeighborsStatus(row, col, cell_value) {
            let checker = [];
            checker[0] = !hasCellMineAndFlag(row - 1, col - 1);
            checker[1] = !hasCellMineAndFlag(row - 1, col);
            checker[2] = !hasCellMineAndFlag(row - 1, col + 1);
            checker[3] = !hasCellMineAndFlag(row, col + 1);
            checker[4] = !hasCellMineAndFlag(row + 1, col + 1);
            checker[5] = !hasCellMineAndFlag(row + 1, col);
            checker[6] = !hasCellMineAndFlag(row + 1, col - 1);
            checker[7] = !hasCellMineAndFlag(row, col - 1);

            let checker1 = [];
            checker1[0] = hasCellFlag(row - 1, col - 1);
            checker1[1] = hasCellFlag(row - 1, col);
            checker1[2] = hasCellFlag(row - 1, col + 1);
            checker1[3] = hasCellFlag(row, col + 1);
            checker1[4] = hasCellFlag(row + 1, col + 1);
            checker1[5] = hasCellFlag(row + 1, col);
            checker1[6] = hasCellFlag(row + 1, col - 1);
            checker1[7] = hasCellFlag(row, col - 1);

            let is_game_over = false;
            let counter = 0;
            for (let i = 0; i < checker.length; i++) {
                if (checker[i]) {
                    is_game_over = true;
                    break;
                }
            }
            for (let i = 0; i < checker1.length; i++) {
                if (checker1[i]) {
                    counter++;
                }
            }

            if (counter == cell_value) {
                if (!is_game_over) {
                    revealNeighbors(row - 1, col - 1);
                    revealNeighbors(row - 1, col);
                    revealNeighbors(row - 1, col + 1);
                    revealNeighbors(row, col + 1);
                    revealNeighbors(row + 1, col + 1);
                    revealNeighbors(row + 1, col);
                    revealNeighbors(row + 1, col - 1);
                    revealNeighbors(row, col - 1);
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        }

        attachGridCellsEvents(function (cell) {
            cell.removeEventListener("mousedown", doMouseDownActions);
            cell.addEventListener("mousedown", function () {

                if (cell.getAttribute("class") == "revealed" &&
                    cell.getAttribute("data-value") &&
                    cell.getAttribute("data-value") != "mine") {
                    let row = parseInt(cell.id.charAt(1)), col = parseInt(cell.id.charAt(2));
                    let cell_value = cell.getAttribute("data-value");
                    let is_game_over = getNeighborsStatus(row, col, cell_value);
                    if (is_game_over) {
                        document.getElementsByClassName("smile")[0].removeAttribute("data-value");
                        alert("Game over!");
                        revealMines();
                    }
                }
            });
            cell.addEventListener("mousedown", doMouseDownActions);
        });
    }

    function checkGameId() {
        if (game_id != "minesweeper") {
            alert("This is not minesweeper game BTW!")
        }
    }

    function setGameTitle() {
        document.getElementById("game-title").innerHTML = game_title;
    }

    function parseBool(val) {
        return val === true || val === "true"
    }

    function isTimerEnabled() {
        return parseBool(game_levels[game_current_level - 1]["timer"]);
    }

    function setTimer() {
        if (isTimerEnabled()) {
            var time = game_levels[game_current_level - 1]["time"];
        } else {
            time = 0;
        }
        document.getElementsByClassName("counter")[1].innerHTML = time;
    }

    function updateTimer() {
        if (isTimerEnabled()) {
            timer = setInterval(function () {
                document.getElementsByClassName("counter")[1].innerHTML--;
            }, 1000);
        } else {
            attachGridCellsEvents(function (cell) {
                cell.addEventListener("mouseup", function (event) {
                    if (event.button == 0)
                        document.getElementsByClassName("counter")[1].innerHTML++;
                })
            })
        }
    }

    function setGameOver() {
        if (isTimerEnabled()) {
            setTimeout(function () {
                clearInterval(timer);
                document.getElementsByClassName("smile")[0].removeAttribute("data-value");
                alert("Game over!");
                revealMines();
                submitPlayerRecord();
            }, document.getElementsByClassName("counter")[1].innerHTML * 1000)
        } else {
            clearInterval(timer);
        }

        attachGridCellsEvents(function (cell) {
            cell.addEventListener("mouseup", function (event) {
                if (event.button == 0 && this.getAttribute("data-value") == "mine") {
                    clearInterval(timer);
                    this.className = "revealed";
                    document.getElementsByClassName("smile")[0].removeAttribute("data-value");
                    alert("Game over!");
                    revealMines();
                    removeGridCellsEvent();
                    submitPlayerRecord();
                }
            })
        })
    }

    function revealMines() {
        let cells = getCells();
        for (let c = 0; c < cells.length; c++) {
            if (cells[c].getAttribute("data-value") == "mine") {
                if (cells[c].getAttribute("class") == "revealed")
                    cells[c].style.backgroundColor = '#aa3120';
                cells[c].className = "revealed  ";
            }
        }
    }

    function setCounter() {
        let mines = game_levels[game_current_level - 1]["mines"];
        document.getElementsByClassName("counter")[0].innerHTML = mines - flagged_cell;
    }

    function removeRightClickContextMenu() {
        window.oncontextmenu = function () {
            return false;
        }
    }

    function hasCellMine(row, col) {
        try {
            let cell = document.getElementById(`c${row}${col}`);
            return cell.getAttribute("data-value") == 'mine';
        } catch (err) {
            return false;
        }
    }

    function hasCellFlag(row, col) {
        try {
            let cell = document.getElementById(`c${row}${col}`);
            return cell.getAttribute("class") == 'flag';
        } catch (err) {
            return false;
        }
    }

    function hasCellMineAndFlag(row, col) {
        let cell = document.getElementById(`c${row}${col}`);
        if (cell) {
            if (hasCellFlag(row, col))
                return true;
            if (!hasCellFlag(row, col) && hasCellMine(row, col))
                return false;
            else
                return true;
        } else {
            return true;
        }
    }

    function calculateNeighborMines() {
        function calculateCellNeighborMines(cell) {
            if (cell.getAttribute("data-value") != "mine") {
                let rows = game_levels[game_current_level - 1]["rows"];
                let cols = game_levels[game_current_level - 1]["cols"];
                let row = parseInt(cell.id.charAt(1)), col = parseInt(cell.id.charAt(2));

                let total_mines = 0;
                if (hasCellMine(row - 1, col - 1))
                    total_mines++;
                if (hasCellMine(row - 1, col))
                    total_mines++;
                if (hasCellMine(row - 1, col + 1))
                    total_mines++;
                if (hasCellMine(row, col + 1))
                    total_mines++;
                if (hasCellMine(row + 1, col + 1))
                    total_mines++;
                if (hasCellMine(row + 1, col))
                    total_mines++;
                if (hasCellMine(row + 1, col - 1))
                    total_mines++;
                if (hasCellMine(row, col - 1))
                    total_mines++;

                cell_neighbor_mines[`c${row}${col}`] = total_mines;
            }
        }

        let cells = getCells();
        for (let c = 0; c < cells.length; c++) {
            calculateCellNeighborMines(cells[c])
        }
    }

    function startNewLevel() {
        let smile_el = document.getElementsByClassName("smile")[0];
        smile_el.addEventListener("click", function () {
            let level_type = prompt("please enter level type: (beginner, medium, hard)");
            smile_el.setAttribute("data-value", "ok");
            recreateGrid();
            newGame(level_type);
        })
    }

    function recreateGrid() {
        let current_grid = document.getElementsByClassName("grid")[0];
        current_grid.parentNode.removeChild(current_grid);

        let body = document.getElementsByClassName("window")[0];
        let grid = document.createElement("div");
        grid.className = "grid";
        body.appendChild(grid)
    }

    function setUserName() {
        function doTheMagic() {
            let username = document.createElement("p");
            if (/^[A-Za-z]+$/.test(input.value)) {
                username.innerHTML = input.value;
                modal_content.replaceChild(username, input);
                modal_content.removeChild(button);
            } else {
                alert("username has just letters");
            }
        }

        let modal_content = document.getElementsByClassName("modal-content")[0];
        let button = modal_content.getElementsByTagName("button")[0];
        let input = document.getElementById("name");
        button.addEventListener("click", doTheMagic);
        input.addEventListener("keydown", function (event) {
            if (event.key == 'Enter')
                doTheMagic()
        });
    }

    function dragWindowGame() {
        let x_pos_mouse = 0, y_pos_mouse = 0;
        let elem_left = 0, elem_top = 0;
        let to_be_dragged = null;

        function dragInit(element) {
            to_be_dragged = element;
            elem_left = x_pos_mouse - to_be_dragged.offsetLeft;
            elem_top = y_pos_mouse - to_be_dragged.offsetTop;
        }

        function moveElement(element) {
            x_pos_mouse = document.all ? window.event.clientX : element.pageX;
            y_pos_mouse = document.all ? window.event.clientY : element.pageY;
            if (to_be_dragged !== null) {
                let left = (x_pos_mouse - elem_left);
                let top = (y_pos_mouse - elem_top);
                // if (left > 0 || left < (window.innerWidth - element.width) ||
                //     top > 0 || top < (window.innerHeight - element.height))
                //     return;

                to_be_dragged.style.left = left + 'px';
                to_be_dragged.style.top = top + 'px';
            }
        }

        function destroy() {
            to_be_dragged = null;
        }

        let gameWindow = document.getElementsByClassName("window")[0];
        let titleBar = document.getElementsByClassName("title-bar")[0];
        titleBar.addEventListener("mousedown", function () {
            this.style.cursor = "pointer";
            dragInit(gameWindow);
            return false;
        });
        document.addEventListener("mousemove", moveElement);
        document.addEventListener("mouseup", destroy)
    }

    function haveUserWon() {
        let cells = getCells();
        for (let c = 0; c < cells.length; c++) {
            if (cells[c].getAttribute('data-value') != 'mine' && cells[c].getAttribute('class') != 'revealed')
                return false;
        }
        return true;
    }

    function showWinMessage() {
        let win_interval_id = setInterval(function () {
            if (haveUserWon()) {
                let cells = getCells();
                for (let c = 0; c < cells.length; c++) {
                    if (cells[c].getAttribute('data-value') == 'mine')
                        cells[c].className = 'flag';
                }
                document.getElementsByClassName("smile")[0].setAttribute("data-value", "win");
                alert("You have won!");
                clearInterval(win_interval_id);
            }
        }, 1000)
    }

    function submitPlayerRecord() {
        let title = 'بازی مین روب';
        let request = new XMLHttpRequest();
        request.open('POST', `http://localhost:8000/games/${title}/leaderboard`);
        request.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let response = this.responseText;
                    console.log(response);
                } else {
                    console.log(this.statusText);
                }
            }
        };
        request.send({'score': 2000});
    }

    removeRightClickContextMenu();

    getGameXML(parseXmlString);
    renderElements();
    checkGameId();
    setGameTitle();
    setUserName();
    dragWindowGame();

    newGame();
    startNewLevel();
    showWinMessage();
}());