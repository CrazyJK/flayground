package jk.kamoru.flayground.info.service;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayFileHandler;
import jk.kamoru.flayground.flay.service.FlayService;
import jk.kamoru.flayground.info.domain.Actress;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ActressInfoService extends InfoServiceAdapter<Actress, String> {

	@Autowired FlayService flayService;

	@Override
	public void update(Actress update) {
		super.update(update);
	}

	public void rename(Actress actress, String oldName) {
		if (actress.getName().equals(oldName)) {
			super.update(actress);
		} else { // 이름이 바꼈다
			log.info("rename {} to {}", oldName, actress.getName());
			if (super.infoSource.contains(actress.getName())) { // 있는 이름이다 
				super.update(actress);
			} else { // 새이름이다
				super.create(actress);
			}
			
			// 파일에서 이름을 변경하기
			Collection<Flay> flayListByActress = flayService.findByKeyValue("actress", oldName);
			log.info("{} found {}", oldName, flayListByActress.size());

			for (Flay flay : flayListByActress) {
				// replace name
				List<String> actressList = flay.getActressList();
				actressList.remove(oldName);
				actressList.add(actress.getName());

				FlayFileHandler.rename(flay, actressList);
			}
		}
	}

	public Collection<Actress> findByLocalname(String localname) {
		return super.infoSource.list().stream().filter(a -> StringUtils.equals(a.getLocalName(), localname)).collect(Collectors.toList());
	}

}
