# Axios 二次封装说明

在src下的api.tsx中 进行了Axios 二次封装

设置了请求拦截器和响应拦截器，对get和post请求做了通用化处理

后续在api中编写的接口，需要在此处做相关处理

使用时，从api.tsx导出相关方法
