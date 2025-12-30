interface db_keys {
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
}
type t_db = {
    DB: db_keys;
    port: number;
};
export default class Db {
    private iv_Data;
    get pt_Data(): t_db;
    constructor();
}
export {};
