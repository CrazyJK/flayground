package jk.kamoru.flayground.diary;

import java.util.Collection;
import java.util.Set;

public interface DiaryService {

  Set<String> dates();

  Collection<Diary> list();

  Diary findByDate(String date);

  Diary save(Diary diary);

}
