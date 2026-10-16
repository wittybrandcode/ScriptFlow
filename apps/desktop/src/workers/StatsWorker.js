export const StatsWorker = {
  /**
   * معالجة إحصائيات ضخمة (Map/Reduce) للسيناريو
   */
  async calculateGlobalStats(payload) {
    const { scenes, characters, locations, blocks } = payload;
    
    console.log('[StatsWorker] Starting heavy analytics computation...');
    const startTime = performance.now();

    // 1. حساب مشاهدة الشخصيات (Character Screen Time/Appearances)
    const characterStats = {};
    characters.forEach(c => {
      characterStats[c.id] = { name: c.name, appearances: 0, linesOfDialogue: 0 };
    });

    // 2. تحليل الكتل (Blocks Analysis)
    blocks.forEach(block => {
       if (block.type === 'DIALOGUE' && block.character_id && characterStats[block.character_id]) {
         characterStats[block.character_id].linesOfDialogue++;
       }
    });

    // 3. تحليل المشاهد وتواجد الشخصيات فيها (Presence)
    const locationStats = {};
    locations.forEach(l => {
      locationStats[l.id] = { name: l.name, sceneCount: 0 };
    });

    scenes.forEach(scene => {
       // إضافة تواجد الموقع
       if (scene.location_id && locationStats[scene.location_id]) {
         locationStats[scene.location_id].sceneCount++;
       }
       
       // إضافة ظهور الشخصيات في المشهد
       try {
         const presentChars = JSON.parse(scene.present_characters || '[]');
         presentChars.forEach(charId => {
           if (characterStats[charId]) {
             characterStats[charId].appearances++;
           }
         });
       } catch (e) {
         // تجاهل المشاهد التالفة
       }
    });

    const endTime = performance.now();
    console.log(`[StatsWorker] Analytics completed in ${(endTime - startTime).toFixed(2)}ms`);

    return {
      success: true,
      executionTimeMs: (endTime - startTime),
      characterStats: Object.values(characterStats).sort((a, b) => b.appearances - a.appearances),
      locationStats: Object.values(locationStats).sort((a, b) => b.sceneCount - a.sceneCount)
    };
  }
};
