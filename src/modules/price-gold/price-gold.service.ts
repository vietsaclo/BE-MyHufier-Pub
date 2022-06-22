import { IsNumber } from 'class-validator';
import { TaskRes } from './../../common/Classess';
import { PriceGold } from './../../entities/price-gold.entity';
import { Repository, Connection } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { PublicModules } from 'src/common/PublicModules';
import moment from 'moment';
import { FilterQueryPriceGold } from './dto/FilterQueryPriceGold';

@Injectable()
export class PriceGoldService {
  private priceGoldRepo: Repository<PriceGold> = null;
  constructor(private readonly connection: Connection) {
    this.priceGoldRepo = this.connection.getRepository(PriceGold);
    this.create();
  }

  async crawlDataInsertDB() {
    let task: TaskRes = null;
    const url = 'https://sjc.com.vn/xml/tygiavang.xml';

    const dataXml = await PublicModules.fun_get(url);
    let resultData;
    const xml2js = require('xml2js');

    xml2js.parseString(dataXml, (err, result) => {
      if (err) {
        throw err;
      }

      const json = JSON.stringify(result, null, 4);
      const obj = JSON.parse(json);
      const updated = obj.root.ratelist[0].$.updated;

      obj.root.ratelist[0].city.map((v, k) => {
        v.item.forEach(async e => {
          let find = await this.priceGoldRepo.findOne({
            where: {
              province: v.$.name,
              typeGold: e.$.type,
              sell: e.$.sell,
              buy: e.$.buy,
              dateUpdated: updated.toString()
            },
          });
          if (!find) {
            const newData = this.priceGoldRepo.create();
            newData.province = v.$.name;
            newData.buy = e.$.buy;
            newData.sell = e.$.sell;
            newData.typeGold = e.$.type;
            newData.dateUpdated = updated.toString();
            resultData = await this.priceGoldRepo.save(newData);
            task = PublicModules.fun_makeResCreateSucc(resultData);
          } else {       
            find.updateAt = new Date(new Date());
            resultData = await this.priceGoldRepo.save(find);
          }
        });
      });
    });
    return task;
  }

  async create() {
    setInterval(() => {
      this.crawlDataInsertDB();
    }, Number.parseInt(process.env.SET_TIME_SECOND_PRICE_GOLD) * 1000);
  }

  async findAll(query: FilterQueryPriceGold) {
    let task: TaskRes = null;
    // const data = await this.priceGoldRepo.find();

    const dayQuery = query.day || 1;
    const province = query.province || "Hồ Chí Minh";

    let dayNow = new Date().getDate();
    let monthNow = new Date().getMonth();
    
    


    let start = new Date();
    let end = new Date();
    

    let qb = this.priceGoldRepo.createQueryBuilder("PriceGold")
    .orderBy('PriceGold.updateAt', 'ASC')

    if (province) {
      qb.andWhere("PriceGold.province = :province", {province});
    }

    if (dayQuery >= 1 && dayQuery <= 7) {
      dayNow = dayNow - dayQuery;
      
      if (dayNow != 0) {
        start.setDate(dayNow);
      }      
      if (dayNow <= 0) {
        start.setMonth(monthNow - 1);
      }
      qb = qb.andWhere('PriceGold.updateAt BETWEEN :start AND :end', { start, end });
    }

    if (dayQuery == 30) {
      start.setMonth(monthNow - 1);
      qb = qb.andWhere('PriceGold.updateAt BETWEEN :start AND :end', { start, end });
    }

    if (dayQuery == 90) {
      start.setMonth(monthNow - 3);
      qb = qb.andWhere('PriceGold.updateAt BETWEEN :start AND :end', { start, end });
    }

    const data = await qb.getMany();
    task = PublicModules.fun_makeResListSucc(data);
    return task;
  }
}
