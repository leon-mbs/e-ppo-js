e-ppo  js
========
Решение  для  подписифискальных документов перед  отправкой  в  налоговую 
   
Выполняется  в  браузере,  портировано с  проекта  на   NodeJs

[https://github.com/ossystem/internal-digital-signature-service](https://github.com/ossystem/internal-digital-signature-service)  

####
Состав
 
* 8030938.cer    сертификат
* Key-6.dat      ключ
* index.html     пример  использования
* epp.js         финкции подлписи
* signer.js      сборка  node  модулей на  клиенте
* signer_src.js  исходник  для  сборки
* keys.php       загрузка ключей, пароля (и если  нужно  документов  для  подписи)
* tsp-proxy.php  прокси  файл для  получени  отметки  времени.

Поскольку  отправлять  запросы  к  сервисам  налоговой и сервисам ЭЦП с  клиента  непосредственно  нельзя изза CORS нужно  использовать  бекенд  или  внешние прокси.
  

Для  пересборки  библиотек нужно выполнить  команды
npm install gost89
npm install jkurwa
npm install encoding
npm install -п browserify 

browserify signer_src.js -o signer.js

```
```
Поскольку  результирующий файл  достаточно  большой решение  больше подходит  для  приложений со  SPA страницами

Примеры как   формировать  команды  и документы  для  отправки можно  посмотреть в  проектах

[https://github.com/ossystem/e-receipt](https://github.com/ossystem/e-receipt)  
[https://github.com/max1gu/e-rro](https://github.com/max1gu/e-rro)  



 

 
