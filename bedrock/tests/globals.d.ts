// console 由基岩脚本引擎注入，不在 ES 标准 lib 里。
// 见 Microsoft Learn「Script API / globals console」。
declare var console: {
    log(...data: unknown[]): void;
    warn(...data: unknown[]): void;
    error(...data: unknown[]): void;
};
