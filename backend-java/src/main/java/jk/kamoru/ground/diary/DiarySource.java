package jk.kamoru.ground.diary;

import java.util.Collection;
import java.util.Set;

public interface DiarySource {

  Set<String> dates();

  Collection<Diary> list();

  Diary find(String date);

  Diary save(Diary diary);

}
