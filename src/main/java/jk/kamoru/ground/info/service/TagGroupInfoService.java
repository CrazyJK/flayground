package jk.kamoru.ground.info.service;

import org.springframework.stereotype.Service;

import jk.kamoru.ground.info.domain.TagGroup;

@Service
public class TagGroupInfoService extends InfoServiceAdapter<TagGroup, String> {

  @Override
  public TagGroup create(TagGroup create) {
    return super.create(create);
  }

  @Override
  public void delete(TagGroup delete) {
    super.delete(delete);
  }

}
