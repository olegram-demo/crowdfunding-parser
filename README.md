Парсер краудинвестинговых площадок
==================================

Ссылка на ТЗ: [https://paper.dropbox.com/doc/Dqubq6p94ldHDcW6xBqrh](https://paper.dropbox.com/doc/Dqubq6p94ldHDcW6xBqrh)

Установка
---------
1. Установить nodejs >= 7.7 [https://nodejs.org/en/download/current/](https://nodejs.org/en/download/current/)
2. Установить yarn [https://yarnpkg.com/lang/en/docs/install/](https://yarnpkg.com/lang/en/docs/install/)
3. [Скачать архив с исходниками](https://gitlab.com/CrowdfundingAggregator/parser/repository/master/archive.zip) и распокавать его, либо склонировать репозиторий командой `git clone https://gitlab.com/CrowdfundingAggregator/parser.git your_dir_name` (в этом случае должен быть установлен git).
4. Открыть консоль, перейти в директорию проекта.
5. Выполнить команду `yarn build`. Эта команда подтянет все зависимости и соберет js файлы. Процесс займет пару минут.
6. Для работы headless браузера chrome на linux возможно понадобится установить дополнительные пакеты. Для debian дистрибутивов это можно сделать запустив скрипт deb-install. В Windows все должно работать из коробки. На маке не проверял.

Использование
-------------
На данный момент реализован парсинг crowdcube, similarweb, cranchbase. 

Для получения проектов необходимо выполнить команду `yarn get-projects`. 

Результаты работы скрипта будут отображаться в консоли. Также все действия логируются. Логи находятся в директории `logs`. 

После того как проекты будут получены они сохраняются в базу sqlite (файл `db.sqlite3` в корне проекта). 

Учетные записи, под которыми осуществляется вход на crowdcube.com лежат в файле `src/config/accounts.ts`. При необходимости туда можно вставить свои данные. 

ВНИМАНИЕ!!! после изменения любых файлов в директории `src` не забываем пересобирать проект командой `yarn build-ts`.

Проверка парсеров
-----------------
Для проверки парсеров можно воспользоваться скриптом самодиагностики (запускается командой `yarn self-diagnostic`). Этот скрипт последовательно проверит все парсеры и выведет результаты в консоль. Можно проверить отдельный парсер, передав его в качестве параметра.

- `yarn self-diagnostic crowdcube` - проверит парсер площадки crowdcube.com
- `yarn self-diagnostic similarweb` - проверит парсер similarweb
- `yarn self-diagnostic crunchbase` - проверит парсер crunchbase