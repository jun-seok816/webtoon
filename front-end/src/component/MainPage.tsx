import React, { useState } from "react";
import { Main } from "@jsLib/class/Main_class";
import { Upload } from "@jsLib/class/Upload";
import WebtoonUploadPage from "./WebtoonUploadPage";
import LoadingScreen from "./LoadingScreen";
import { Loading } from "@jsLib/class/Loading";

class Webtoon extends Main {
  private iv_upload: Upload;
  private iv_loading:Loading;

  public pt_upload(){
    return this.iv_upload;
  }

  public pt_loading(){
    return this.iv_loading;
  }

  constructor() {
    super();
    this.iv_upload = new Upload(this.im_forceRender.bind(this));
    this.iv_loading = new Loading(this.im_forceRender.bind(this),"이미지 업로드");
  }
}

export function MainPage() {
  const [lv_Obj] = useState(()=>{
    return new Webtoon();
  })

  lv_Obj.im_Prepare_Hooks(()=>{

  })
  return (
    <>
      <LoadingScreen Loading={lv_Obj.pt_loading()}/>
      <WebtoonUploadPage lv_Obj={lv_Obj.pt_upload()} Loading={lv_Obj.pt_loading()}/>
    </>
  );
}
